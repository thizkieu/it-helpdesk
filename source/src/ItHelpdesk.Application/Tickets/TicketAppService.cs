using ItHelpdesk.Permissions;
using ItHelpdesk.Priorities;
using ItHelpdesk.Provider;
using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace ItHelpdesk.Tickets
{
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

        // Khai báo biến Provider để gọi Store
        private readonly ITicketProvider _ticketProvider;

        public TicketAppService(
            IRepository<Ticket, long> repository,
            IRepository<TicketActivity, long> ticketActivityRepository,
            IRepository<TicketComment, long> ticketCommentRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IBlobContainer blobContainer,
            IRepository<TicketAttachment, long> attachmentRepository,
            IRepository<Priority, long> priorityRepository,
            IHttpContextAccessor httpContextAccessor,
            ITicketProvider ticketProvider)
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

            UpdatePolicyName = ItHelpdeskPermissions.Tickets.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Tickets.Delete;
        }

        // ==============================================================================
        // GHI ĐÈ HÀM GETLIST: BẢO MẬT & PHÂN QUYỀN XEM TICKET THEO VAI TRÒ
        // ==============================================================================
        public override async Task<PagedResultDto<TicketDto>> GetListAsync(GetTicketListDto input)
        {
            try
            {
                // 1. Chỉ định rõ: Chỉ Admin hoặc IT mới có quyền xem toàn bộ ticket hệ thống
                // (Bạn có thể bổ sung thêm tên role khác vào đây nếu muốn, ví dụ: || CurrentUser.IsInRole("HR"))
                bool isPrivilegedUser = CurrentUser.IsInRole("admin")
                                     || CurrentUser.IsInRole("Admin")
                                     || CurrentUser.IsInRole("IT");

                Guid? secureCreatorId = null;

                // 2. Nếu KHÔNG phải Admin hoặc IT (tức là User bình thường) -> Ép buộc chỉ lấy ticket của chính họ tạo
                if (!isPrivilegedUser)
                {
                    secureCreatorId = CurrentUser.Id;
                }

                // 3. Đóng gói tham số vào TicketListRequest để truyền vào Stored Procedure
                var request = new TicketListRequest
                {
                    FilterText = input.Filter,
                    Status = input.Status.HasValue ? (int)input.Status.Value : null,

                    // Các điều kiện lọc mở rộng
                    AssigneeId = input.AssigneeId,
                    TeamId = input.TeamId,
                    Unassigned = input.Unassigned,

                    // Gắn ID người tạo đã được phân quyền chặt chẽ từ Backend
                    CreatorId = secureCreatorId,

                    // Thông số phân trang
                    PageIndex = input.MaxResultCount > 0 ? input.SkipCount / input.MaxResultCount : 0,
                    PageSize = input.MaxResultCount > 0 ? input.MaxResultCount : 10
                };

                // 4. Gọi Provider để thực thi Stored Procedure
                var providerData = await _ticketProvider.GetListAsync(request);

                var totalCount = providerData?.Count ?? 0;

                if (providerData == null || totalCount == 0)
                {
                    return new PagedResultDto<TicketDto>(0, new List<TicketDto>());
                }

                // 5. Map dữ liệu trả về cho giao diện
                var ticketDtos = ObjectMapper.Map<List<TicketListQueryResponse>, List<TicketDto>>(providerData);

                return new PagedResultDto<TicketDto>(totalCount, ticketDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LỖI TẠI TICKET PROVIDER GETLIST]: {ex.Message}");
                throw;
            }
        }
        // ==============================================================================

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

            return MapToGetOutputDto(ticket);
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
                    ticket.TargetResolutionTime = now.AddMinutes(priority.ResolutionMinutes);
                    return;
                }
            }
            ticket.TargetResponseTime = now.AddDays(1);
            ticket.TargetResolutionTime = now.AddDays(5);
        }

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

        public async Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null)
        {
            var ticket = await Repository.GetAsync(ticketId);
            if (ticket.Status == newStatus) return;

            var oldStatus = ticket.Status;
            ticket.Status = newStatus;

            if ((newStatus == TicketStatus.Resolved || newStatus == TicketStatus.Closed) && !ticket.ResolvedAt.HasValue)
            {
                ticket.ResolvedAt = DateTime.Now;
            }

            await Repository.UpdateAsync(ticket);

            var activity = new TicketActivity(
                ticketId,
                activityType: "StatusChange",
                description: $"Đã thay đổi trạng thái từ {oldStatus} sang {newStatus}",
                oldValue: oldStatus.ToString(),
                newValue: newStatus.ToString()
            );
            await _ticketActivityRepository.InsertAsync(activity);

            if (!string.IsNullOrWhiteSpace(comment))
            {
                var ticketComment = new TicketComment(
                    ticketId,
                    content: comment,
                    isInternal: false
                );
                await _ticketCommentRepository.InsertAsync(ticketComment);
            }
        }

        public async Task AddCommentAsync(long ticketId, string content, bool isInternal = false)
        {
            var ticketComment = new TicketComment(
                ticketId,
                content: content,
                isInternal: isInternal
            );
            await _ticketCommentRepository.InsertAsync(ticketComment);

            var activity = new TicketActivity(
                ticketId,
                activityType: "CommentAdded",
                description: $"Đã thêm một bình luận {(isInternal ? "nội bộ" : "mới")}"
            );
            await _ticketActivityRepository.InsertAsync(activity);
        }

        public async Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId)
        {
            var activities = await _ticketActivityRepository.GetListAsync(x => x.TicketId == ticketId);
            var comments = await _ticketCommentRepository.GetListAsync(x => x.TicketId == ticketId);

            var timeline = new List<TicketTimelineDto>();

            foreach (var act in activities)
            {
                timeline.Add(new TicketTimelineDto
                {
                    Type = "Activity",
                    Content = act.Description,
                    IsInternal = false,
                    CreationTime = act.CreationTime,
                    CreatorId = act.CreatorId
                });
            }

            foreach (var cmt in comments)
            {
                timeline.Add(new TicketTimelineDto
                {
                    Type = "Comment",
                    Content = cmt.Content,
                    IsInternal = cmt.IsInternal,
                    CreationTime = cmt.CreationTime,
                    CreatorId = cmt.CreatorId
                });
            }

            var userIds = timeline.Where(x => x.CreatorId.HasValue).Select(x => x.CreatorId.Value).Distinct().ToList();
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

            return timeline.OrderBy(x => x.CreationTime).ToList();
        }

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

        public async Task AssignTicketAsync(AssignTicketDto input)
        {
            var ticket = await Repository.GetAsync(input.TicketId);

            var oldAssignee = ticket.AssigneeId;
            var oldTeam = ticket.TeamId;

            ticket.AssigneeId = input.AssigneeId;
            ticket.TeamId = input.TeamId;

            if (ticket.Status == TicketStatus.New && (input.AssigneeId.HasValue || input.TeamId.HasValue))
            {
                ticket.Status = TicketStatus.Assigned;
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
            {
                desc += $" (Phân về Nhóm số: {input.TeamId})";
            }

            var activity = new TicketActivity(
                input.TicketId,
                activityType: "TicketAssigned",
                description: desc,
                oldValue: oldAssignee?.ToString(),
                newValue: input.AssigneeId?.ToString()
            );
            await _ticketActivityRepository.InsertAsync(activity);
        }

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
    }
}