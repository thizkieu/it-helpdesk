using System;
using ItHelpdesk.Priorities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace ItHelpdesk.Tickets
{
    // Đã xóa/comment [Authorize(...)] ở đầu class để tránh chặn toàn bộ End User
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

        public TicketAppService(
            IRepository<Ticket, long> repository,
            IRepository<TicketActivity, long> ticketActivityRepository,
            IRepository<TicketComment, long> ticketCommentRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IBlobContainer blobContainer,
            IRepository<TicketAttachment, long> attachmentRepository,
            IRepository<Priority, long> priorityRepository)
            : base(repository)
        {
            _ticketActivityRepository = ticketActivityRepository;
            _ticketCommentRepository = ticketCommentRepository;
            _userRepository = userRepository;
            _blobContainer = blobContainer;
            _attachmentRepository = attachmentRepository;
            _priorityRepository = priorityRepository;

            // Mở công khai quyền Get/GetList để người dùng cuối truy xuất được danh sách của họ
            // GetPolicyName = ItHelpdeskPermissions.Tickets.Default;
            // GetListPolicyName = ItHelpdeskPermissions.Tickets.Default;

            // Mở công khai quyền Create để End User không bị vướng lỗi 403 khi tạo mới yêu cầu
            // CreatePolicyName = ItHelpdeskPermissions.Tickets.Create;

            // Giữ lại bảo mật cho Sửa / Xóa (Dành cho KTV/Admin)
            UpdatePolicyName = ItHelpdeskPermissions.Tickets.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Tickets.Delete;
        }

        public override async Task<TicketDto> CreateAsync(CreateUpdateTicketDto input)
        {
            var ticket = MapToEntity(input);

            // Fix: Thêm ffff (mili-giây) để chống lỗi trùng mã khi có nhiều người tạo cùng lúc
            ticket.TicketNo = "TK-" + DateTime.Now.ToString("yyyyMMddHHmmssffff");
            ticket.Status = TicketStatus.New;

            await CalculateSlaAsync(ticket);

            await Repository.InsertAsync(ticket, autoSave: true);

            var activity = new TicketActivity(
                ticket.Id,
                activityType: "TicketCreated",
                description: "Yêu cầu hỗ trợ đã được tạo mới"
            );
            await _ticketActivityRepository.InsertAsync(activity);

            return MapToGetOutputDto(ticket);
        }

        private async Task CalculateSlaAsync(Ticket ticket)
        {
            var now = DateTime.Now;

            // Fix: Kiểm tra > 0 thay vì dùng .HasValue
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

            // Mặc định nếu không có Priority hợp lệ
            ticket.TargetResponseTime = now.AddDays(1);
            ticket.TargetResolutionTime = now.AddDays(5);
        }

        public async Task UploadAttachmentAsync(UploadAttachmentDto input)
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
            await _ticketActivityRepository.InsertAsync(activity);
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

            var userIds = timeline.Where(x => x.CreatorId.HasValue)
                                  .Select(x => x.CreatorId.Value)
                                  .Distinct()
                                  .ToList();

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

        protected override async Task<IQueryable<Ticket>> CreateFilteredQueryAsync(GetTicketListDto input)
        {
            var query = await base.CreateFilteredQueryAsync(input);

            if (!string.IsNullOrWhiteSpace(input.Filter))
            {
                query = query.Where(x => x.Title.Contains(input.Filter) || x.TicketNo.Contains(input.Filter));
            }

            if (input.Status.HasValue)
            {
                var statusEnum = (TicketStatus)input.Status.Value;
                query = query.Where(x => x.Status == statusEnum);
            }

            if (input.AssigneeId.HasValue)
            {
                query = query.Where(x => x.AssigneeId == input.AssigneeId.Value);
            }

            if (input.TeamId.HasValue)
            {
                query = query.Where(x => x.TeamId == input.TeamId.Value);
            }

            if (input.Unassigned.HasValue && input.Unassigned.Value)
            {
                query = query.Where(x => x.AssigneeId == null);
            }

            return query;
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

            var activity = new TicketActivity(
                input.TicketId,
                activityType: "TicketAssigned",
                description: $"Đã phân công/chuyển tuyến xử lý ticket (KTV: {input.AssigneeId}, Team: {input.TeamId})",
                oldValue: $"Assignee: {oldAssignee}, Team: {oldTeam}",
                newValue: $"Assignee: {input.AssigneeId}, Team: {input.TeamId}"
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