using ItHelpdesk.Permissions;
using ItHelpdesk.Priorities;
using ItHelpdesk.Provider;
using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using ItHelpdesk.Users;
using ItHelpdesk.SignalR;
using ItHelpdesk.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace ItHelpdesk.Tickets
{
    public class ChangeTicketStatusInput
    {
        public long TicketId { get; set; }
        public TicketStatus NewStatus { get; set; }
        public string? Comment { get; set; }
    }

    public class TicketAppService : CrudAppService<
        Ticket,
        TicketDto,
        long,
        GetTicketListDto,
        CreateUpdateTicketDto>, ITicketAppService
    {
        private readonly IRepository<TicketActivity, long> _ticketActivityRepository;
        private readonly IRepository<TicketComment, long> _ticketCommentRepository;
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IBlobContainer _blobContainer;
        private readonly IRepository<TicketAttachment, long> _attachmentRepository;
        private readonly IRepository<Priority, long> _priorityRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITicketProvider _ticketProvider;
        private readonly IdentityUserManager _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IRepository<AppNotification, Guid> _notificationRepository;

        public TicketAppService(
            IRepository<Ticket, long> repository,
            IRepository<TicketActivity, long> ticketActivityRepository,
            IRepository<TicketComment, long> ticketCommentRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IBlobContainer blobContainer,
            IRepository<TicketAttachment, long> attachmentRepository,
            IRepository<Priority, long> priorityRepository,
            IHttpContextAccessor httpContextAccessor,
            ITicketProvider ticketProvider,
            IdentityUserManager userManager,
            IHubContext<NotificationHub> hubContext,
            IRepository<AppNotification, Guid> notificationRepository)
            : base(repository)
        {
            _ticketActivityRepository = ticketActivityRepository;
            _ticketCommentRepository = ticketCommentRepository;
            _userRepository = userRepository;
            _blobContainer = blobContainer;
            _attachmentRepository = attachmentRepository;
            _priorityRepository = priorityRepository;
            _httpContextAccessor = httpContextAccessor;
            _ticketProvider = ticketProvider;
            _userManager = userManager;
            _hubContext = hubContext;
            _notificationRepository = notificationRepository;

            UpdatePolicyName = ItHelpdeskPermissions.Tickets.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Tickets.Delete;
        }

        // =========================================================================
        // 1. MÀN HÌNH DANH SÁCH YÊU CẦU (IT QUEUE / MY TICKETS)
        // =========================================================================
        public override async Task<PagedResultDto<TicketDto>> GetListAsync(GetTicketListDto input)
        {
            try
            {
                bool isEndUser = CurrentUser.IsInRole("End_User")
                            || CurrentUser.IsInRole("End User")
                            || CurrentUser.IsInRole("user");

                Guid? secureCreatorId = null;

                if (input.IsMyTickets.HasValue && input.IsMyTickets.Value)
                {
                    secureCreatorId = CurrentUser.Id;
                }
                else if (isEndUser)
                {
                    secureCreatorId = CurrentUser.Id;
                }

                var query = await Repository.GetQueryableAsync();

                if (secureCreatorId.HasValue)
                    query = query.Where(x => x.CreatorId == secureCreatorId.Value);

                if (input.Status.HasValue)
                    query = query.Where(x => (int)x.Status == (int)input.Status.Value);

                if (!string.IsNullOrWhiteSpace(input.Filter))
                    query = query.Where(x => x.Title.Contains(input.Filter) || x.TicketNo.Contains(input.Filter));

                if (input.AssigneeId.HasValue)
                    query = query.Where(x => x.AssigneeId == input.AssigneeId.Value);

                if (input.TeamId.HasValue)
                    query = query.Where(x => x.TeamId == input.TeamId.Value);

                if (input.Unassigned.HasValue && input.Unassigned.Value)
                    query = query.Where(x => x.AssigneeId == null);

                // [ĐÃ BỔ SUNG] Lọc quá hạn cho EF Core để đếm tổng số bản ghi (TotalCount) chuẩn xác
                if (input.IsOverdue.HasValue && input.IsOverdue.Value == true)
                {
                    var now = DateTime.Now;
                    query = query.Where(x => x.TargetResolutionTime.HasValue
                                          && x.TargetResolutionTime.Value < now
                                          && (int)x.Status != 3
                                          && (int)x.Status != 4);
                }

                var totalCount = await AsyncExecuter.CountAsync(query);

                var request = new TicketListRequest
                {
                    FilterText = input.Filter,
                    Status = input.Status.HasValue ? (int)input.Status.Value : null,
                    AssigneeId = input.AssigneeId,
                    TeamId = input.TeamId,
                    Unassigned = input.Unassigned,
                    CreatorId = secureCreatorId,
                    PageIndex = input.MaxResultCount > 0 ? input.SkipCount / input.MaxResultCount : 0,
                    PageSize = input.MaxResultCount > 0 ? input.MaxResultCount : 10,

                    // [ĐÃ BỔ SUNG] Truyền cờ IsOverdue xuống tầng Provider / Store Procedure
                    IsOverdue = input.IsOverdue ?? false
                };

                var providerData = await _ticketProvider.GetListAsync(request);

                if (providerData == null || !providerData.Any())
                {
                    return new PagedResultDto<TicketDto>(0, new List<TicketDto>());
                }

                var ticketDtos = ObjectMapper.Map<List<TicketListQueryResponse>, List<TicketDto>>(providerData);
                return new PagedResultDto<TicketDto>(totalCount, ticketDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LỖI TẠI TICKET PROVIDER GETLIST]: {ex.Message}");
                throw;
            }
        }

        // =========================================================================
        // 2. MÀN HÌNH TẠO YÊU CẦU MỚI (CREATE TICKET)
        // =========================================================================
        public override async Task<TicketDto> CreateAsync(CreateUpdateTicketDto input)
        {
            var ticket = MapToEntity(input);
            ticket.TicketNo = "TK-" + DateTime.Now.ToString("yyMMddHHmmss");
            ticket.Status = TicketStatus.New;

            await CalculateSlaAsync(ticket);

            await Repository.InsertAsync(ticket, autoSave: true);

            var activity = new TicketActivity(
                ticket.Id,
                activityType: "TicketCreated",
                description: "Yêu cầu hỗ trợ đã được tạo mới"
            );
            await _ticketActivityRepository.InsertAsync(activity, autoSave: true);

            var message = $"Có vé mới [{ticket.TicketNo}] vừa được tạo: {ticket.Title}";
            await _hubContext.Clients.Group("group_technicians")
                .SendAsync("ReceiveTicketNotification", message);

            return MapToGetOutputDto(ticket);
        }

        private DateTime AddBusinessDays(DateTime startDate, int businessDaysToAdd)
        {
            DateTime result = startDate;
            int addedDays = 0;

            while (addedDays < businessDaysToAdd)
            {
                result = result.AddDays(1);
                if (result.DayOfWeek != DayOfWeek.Saturday && result.DayOfWeek != DayOfWeek.Sunday)
                {
                    addedDays++;
                }
            }
            return result;
        }

        private async Task CalculateSlaAsync(Ticket ticket)
        {
            var now = DateTime.Now;
            if (ticket.PriorityId > 0)
            {
                var priority = await _priorityRepository.FindAsync(ticket.PriorityId);
                if (priority != null)
                {
                    ticket.TargetResponseTime = now.AddMinutes(priority.ResponseMinutes);

                    int slaDays = priority.ResolutionMinutes / (24 * 60);
                    ticket.TargetResolutionTime = AddBusinessDays(now, slaDays > 0 ? slaDays : 3);
                    return;
                }
            }

            ticket.TargetResponseTime = now.AddDays(1);
            ticket.TargetResolutionTime = AddBusinessDays(now, 5);
        }

        // =========================================================================
        // 3. XỬ LÝ FILE ĐÍNH KÈM
        // =========================================================================
        [HttpPost]
        [Route("api/app/ticket/upload-attachment")]
        public async Task UploadAttachmentAsync(UploadAttachmentDto input)
        {
            try
            {
                var bytes = Convert.FromBase64String(input.Base64Content);
                var blobName = $"{Guid.NewGuid()}_{input.FileName}";
                await _blobContainer.SaveAsync(blobName, bytes);

                var attachment = new TicketAttachment(
                    input.TicketId,
                    input.FileName,
                    blobName,
                    bytes.Length,
                    input.ContentType
                );
                await _attachmentRepository.InsertAsync(attachment, autoSave: true);

                var activity = new TicketActivity(
                    input.TicketId,
                    activityType: "FileUploaded",
                    description: $"Đã đính kèm tệp: {input.FileName}"
                );
                await _ticketActivityRepository.InsertAsync(activity, autoSave: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LỖI UPLOAD FILE]: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("api/app/ticket/{ticketId}/attachments")]
        public async Task<List<UploadAttachmentDto>> GetAttachmentsAsync(long ticketId)
        {
            var attachments = await _attachmentRepository.GetListAsync(x => x.TicketId == ticketId);
            var result = new List<UploadAttachmentDto>();

            foreach (var att in attachments)
            {
                var bytes = await _blobContainer.GetAllBytesOrNullAsync(att.BlobName);
                if (bytes != null)
                {
                    result.Add(new UploadAttachmentDto
                    {
                        TicketId = ticketId,
                        FileName = att.FileName,
                        ContentType = att.ContentType,
                        Base64Content = Convert.ToBase64String(bytes)
                    });
                }
            }
            return result;
        }

        // =========================================================================
        // 4. MÀN HÌNH CHI TIẾT TICKET
        // =========================================================================
        [HttpPost]
        [Route("api/app/ticket/change-status")]
        public async Task ChangeStatusAsync([FromBody] ChangeTicketStatusInput input)
        {
            var ticket = await Repository.GetAsync(input.TicketId);

            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu này đã được đóng và không thể thay đổi trạng thái!");
            }

            if (ticket.Status == input.NewStatus) return;

            var oldStatus = ticket.Status;
            ticket.Status = input.NewStatus;

            if ((input.NewStatus == TicketStatus.Resolved || input.NewStatus == TicketStatus.Closed) && !ticket.ResolvedAt.HasValue)
            {
                ticket.ResolvedAt = DateTime.Now;
            }

            await Repository.UpdateAsync(ticket);

            var activity = new TicketActivity(
                input.TicketId,
                activityType: "StatusChange",
                description: $"Đã thay đổi trạng thái từ {oldStatus} sang {input.NewStatus}",
                oldValue: oldStatus.ToString(),
                newValue: input.NewStatus.ToString()
            );
            await _ticketActivityRepository.InsertAsync(activity);

            if (!string.IsNullOrWhiteSpace(input.Comment))
            {
                var ticketComment = new TicketComment(
                    input.TicketId,
                    content: input.Comment,
                    isInternal: false
                );
                await _ticketCommentRepository.InsertAsync(ticketComment);
            }

            if (ticket.CreatorId.HasValue)
            {
                var title = "Cập nhật trạng thái yêu cầu";
                var message = $"Yêu cầu [{ticket.TicketNo}] của bạn đã chuyển sang trạng thái: {input.NewStatus}";

                var notif = AppNotification.CreateNew(ticket.CreatorId.Value, title, message, "success");
                await _notificationRepository.InsertAsync(notif);

                await _hubContext.Clients.Group($"user_{ticket.CreatorId.Value}")
                    .SendAsync("ReceiveTicketNotification", message);
            }
        }

        [RemoteService(false)]
        public async Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null)
        {
            await ChangeStatusAsync(new ChangeTicketStatusInput
            {
                TicketId = ticketId,
                NewStatus = newStatus,
                Comment = comment
            });
        }

        public override async Task<TicketDto> GetAsync(long id)
        {
            var query = await Repository.GetQueryableAsync();
            var entity = await AsyncExecuter.FirstOrDefaultAsync(
                query.Include(x => x.Category)
                     .Include(x => x.Service)
                     .Include(x => x.Priority)
                     .Where(x => x.Id == id)
            );

            if (entity == null)
            {
                throw new Volo.Abp.Domain.Entities.EntityNotFoundException(typeof(Ticket), id);
            }

            var dto = MapToGetOutputDto(entity);

            if (entity.CreatorId.HasValue)
            {
                var creator = await _userRepository.FindAsync(entity.CreatorId.Value);
                if (creator != null)
                {
                    dto.CreatorName = $"{creator.Surname} {creator.Name}".Trim();
                    if (string.IsNullOrWhiteSpace(dto.CreatorName))
                    {
                        dto.CreatorName = creator.UserName;
                    }
                }
            }

            return dto;
        }

        public async Task AddCommentAsync(long ticketId, string content, bool isInternal = false, long? parentId = null)
        {
            var ticket = await Repository.GetAsync(ticketId);

            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu này đã được đóng, không thể bình luận thêm!");
            }

            bool isEndUser = CurrentUser.IsInRole("End_User")
                          || CurrentUser.IsInRole("End User")
                          || CurrentUser.IsInRole("user");

            if (isEndUser)
            {
                isInternal = false;
            }

            var ticketComment = new TicketComment(
                ticketId,
                content: content,
                isInternal: isInternal
            );

            ticketComment.ParentId = parentId;

            await _ticketCommentRepository.InsertAsync(ticketComment);

            var activity = new TicketActivity(
                ticketId,
                activityType: "CommentAdded",
                description: $"Đã thêm một bình luận {(isInternal ? "nội bộ" : "mới")}"
            );
            await _ticketActivityRepository.InsertAsync(activity);

            if (isEndUser && ticket.AssigneeId.HasValue)
            {
                var message = $"Khách hàng vừa phản hồi trên yêu cầu [{ticket.TicketNo}].";
                var notif = AppNotification.CreateNew(ticket.AssigneeId.Value, "Phản hồi từ khách hàng", message, "info");
                await _notificationRepository.InsertAsync(notif);

                await _hubContext.Clients.Group($"user_{ticket.AssigneeId.Value}").SendAsync("ReceiveTicketNotification", message);
            }
            else if (!isEndUser && !isInternal && ticket.CreatorId.HasValue)
            {
                var message = $"Kỹ thuật viên đã gửi phản hồi cho yêu cầu [{ticket.TicketNo}].";
                var notif = AppNotification.CreateNew(ticket.CreatorId.Value, "Phản hồi từ bộ phận IT", message, "info");
                await _notificationRepository.InsertAsync(notif);

                await _hubContext.Clients.Group($"user_{ticket.CreatorId.Value}").SendAsync("ReceiveTicketNotification", message);
            }
        }

        public async Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId)
        {
            bool isEndUser = CurrentUser.IsInRole("End_User")
                          || CurrentUser.IsInRole("End User")
                          || CurrentUser.IsInRole("user");

            var activities = await _ticketActivityRepository.GetListAsync(x => x.TicketId == ticketId);

            var commentsQuery = await _ticketCommentRepository.GetQueryableAsync();
            var filteredComments = await AsyncExecuter.ToListAsync(
                commentsQuery.Where(x => x.TicketId == ticketId && (!isEndUser || x.IsInternal == false))
            );

            var timeline = new List<TicketTimelineDto>();

            foreach (var act in activities)
            {
                timeline.Add(new TicketTimelineDto
                {
                    Id = act.Id,
                    ParentId = null,
                    Type = "Activity",
                    Content = act.Description,
                    IsInternal = false,
                    CreationTime = act.CreationTime,
                    CreatorId = act.CreatorId
                });
            }

            foreach (var cmt in filteredComments)
            {
                timeline.Add(new TicketTimelineDto
                {
                    Id = cmt.Id,
                    ParentId = cmt.ParentId,
                    Type = "Comment",
                    Content = cmt.Content,
                    IsInternal = cmt.IsInternal,
                    CreationTime = cmt.CreationTime,
                    CreatorId = cmt.CreatorId
                });
            }

            var userIds = timeline.Where(x => x.CreatorId.HasValue).Select(x => x!.CreatorId!.Value).Distinct().ToList();
            var users = await _userRepository.GetListAsync(x => userIds.Contains(x.Id));

            foreach (var item in timeline)
            {
                if (item.CreatorId.HasValue)
                {
                    var user = users.FirstOrDefault(x => x.Id == item.CreatorId.Value);
                    item.CreatorName = user != null ? $"{user.Surname} {user.Name}".Trim() : "Hệ thống";
                }
                else
                {
                    item.CreatorName = "Hệ thống";
                }
            }

            var rootItems = timeline.Where(x => x.ParentId == null)
                                    .OrderByDescending(x => x.CreationTime)
                                    .ToList();

            var replies = timeline.Where(x => x.ParentId != null).ToList();

            foreach (var root in rootItems.Where(x => x.Type == "Comment"))
            {
                root.Replies = replies.Where(x => x.ParentId == root.Id)
                                      .OrderBy(x => x.CreationTime)
                                      .ToList();
            }

            return rootItems;
        }

        // =========================================================================
        // 5. PHÂN CÔNG XỬ LÝ
        // =========================================================================
        public async Task<List<UserDto>> GetAssignableTechniciansAsync()
        {
            var query = await _userRepository.GetQueryableAsync();
            var allActiveUsers = await AsyncExecuter.ToListAsync(query.Where(x => x.IsActive));

            var endUsers = await _userManager.GetUsersInRoleAsync("End_User");
            var endUserIds = endUsers.Select(x => x.Id).ToList();

            var assignableUsers = allActiveUsers.Where(x => !endUserIds.Contains(x.Id)).ToList();
            return ObjectMapper.Map<List<IdentityUser>, List<UserDto>>(assignableUsers);
        }

        public async Task AssignTicketAsync(AssignTicketDto input)
        {
            var ticket = await Repository.GetAsync(input.TicketId);

            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu này đã được đóng, không thể phân công lại!");
            }

            var oldAssignee = ticket.AssigneeId;
            ticket.AssigneeId = input.AssigneeId;
            ticket.TeamId = input.TeamId;

            if (ticket.Status == TicketStatus.New && (input.AssigneeId.HasValue || input.TeamId.HasValue))
            {
                ticket.Status = TicketStatus.Assigned;
            }

            if (!ticket.TargetResolutionTime.HasValue)
            {
                int slaDays = 3;
                if (ticket.PriorityId > 0)
                {
                    var priority = await _priorityRepository.FindAsync(ticket.PriorityId);
                    if (priority != null && priority.ResolutionMinutes > 0)
                    {
                        slaDays = priority.ResolutionMinutes / (24 * 60);
                        if (slaDays < 1) slaDays = 1;
                    }
                }
                ticket.TargetResolutionTime = AddBusinessDays(DateTime.Now, slaDays);
            }

            await Repository.UpdateAsync(ticket);

            string assigneeName = "Chưa gán";
            if (input.AssigneeId.HasValue)
            {
                var user = await _userRepository.FindAsync(input.AssigneeId.Value);
                if (user != null) assigneeName = $"{user.Surname} {user.Name}".Trim();
            }

            string desc = $"Đã phân công xử lý ticket cho KTV: {assigneeName}";
            if (input.TeamId.HasValue)
                desc += $" (Phân về Nhóm số: {input.TeamId})";

            var activity = new TicketActivity(
                input.TicketId,
                activityType: "TicketAssigned",
                description: desc,
                oldValue: oldAssignee?.ToString(),
                newValue: input.AssigneeId?.ToString()
            );
            await _ticketActivityRepository.InsertAsync(activity);

            if (input.AssigneeId.HasValue)
            {
                var title = "Phân công công việc mới";
                var message = $"Bạn đã được phân công xử lý yêu cầu [{ticket.TicketNo}].";

                var notif = AppNotification.CreateNew(input.AssigneeId.Value, title, message, "success");
                await _notificationRepository.InsertAsync(notif);

                await _hubContext.Clients.Group($"user_{input.AssigneeId.Value}")
                    .SendAsync("ReceiveTicketNotification", message);
            }
        }

        // =========================================================================
        // 6. DASHBOARD TỔNG QUAN
        // =========================================================================
        [Authorize(ItHelpdeskPermissions.Dashboard.Default)]
        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var query = await Repository.GetQueryableAsync();
            var totalTickets = await query.CountAsync();
            var newTickets = await query.CountAsync(x => x.Status == TicketStatus.New);
            var unassignedTickets = await query.CountAsync(x => x.AssigneeId == null);
            var resolvedTickets = await query.CountAsync(x => x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Closed);

            var now = DateTime.Now;
            var overdueTickets = await query.CountAsync(x => x.Status != TicketStatus.Resolved &&
                                                           x.Status != TicketStatus.Closed &&
                                                           x.TargetResolutionTime.HasValue &&
                                                           x.TargetResolutionTime.Value < now);

            var totalCompletedTickets = await query.CountAsync(x =>
                (x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Closed) &&
                x.ResolvedAt.HasValue &&
                x.TargetResolutionTime.HasValue);

            var onTimeCount = await query.CountAsync(x =>
                (x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Closed) &&
                x.ResolvedAt.HasValue &&
                x.TargetResolutionTime.HasValue &&
                x.ResolvedAt <= x.TargetResolutionTime);

            double complianceRate = totalCompletedTickets > 0
                ? Math.Round((double)onTimeCount / totalCompletedTickets * 100, 2)
                : 100.0;

            return new DashboardStatsDto
            {
                TotalTickets = totalTickets,
                NewTickets = newTickets,
                UnassignedTickets = unassignedTickets,
                ResolvedTickets = resolvedTickets,
                OverdueTickets = overdueTickets,
                SlaComplianceRate = complianceRate
            };
        }

        // =========================================================================
        // 7. API GỌI STORE PROCEDURE
        // =========================================================================
        public async Task<List<TicketListQueryResponse>> GetListFromStoreAsync(TicketListRequest input)
        {
            return await _ticketProvider.GetListAsync(input);
        }

        public async Task<TicketListQueryResponse> GetInfoFromStoreAsync(TicketInfoRequest input)
        {
            return await _ticketProvider.GetInfoAsync(input);
        }

        public async Task<long> InsertViaStoreAsync(TicketInsertOrUpdateRequest input)
        {
            return await _ticketProvider.InsertAsync(input);
        }

        public async Task<long> UpdateViaStoreAsync(TicketInsertOrUpdateRequest input)
        {
            return await _ticketProvider.UpdateAsync(input);
        }

        public async Task<int> DeleteViaStoreAsync(TicketDeleteRequest input)
        {
            return await _ticketProvider.DeleteAsync(input);
        }

        public async Task<List<TicketReportResponse>> GetReportSummaryAsync(TicketReportRequest input)
        {
            return await _ticketProvider.GetReportSummaryAsync(input);
        }

        // =========================================================================
        // AUTOMAPPER CONFIGURATIONS
        // =========================================================================
        protected override Ticket MapToEntity(CreateUpdateTicketDto createInput)
        {
            return ObjectMapper.Map<CreateUpdateTicketDto, Ticket>(createInput);
        }

        protected override void MapToEntity(CreateUpdateTicketDto updateInput, Ticket entity)
        {
            ObjectMapper.Map(updateInput, entity);
        }

        protected override TicketDto MapToGetOutputDto(Ticket entity)
        {
            return ObjectMapper.Map<Ticket, TicketDto>(entity);
        }

        protected override TicketDto MapToGetListOutputDto(Ticket entity)
        {
            return ObjectMapper.Map<Ticket, TicketDto>(entity);
        }
    }
}