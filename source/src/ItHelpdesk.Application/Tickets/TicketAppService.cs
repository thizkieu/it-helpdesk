using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
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

        public TicketAppService(
            IRepository<Ticket, long> repository,
            IRepository<TicketActivity, long> ticketActivityRepository,
            IRepository<TicketComment, long> ticketCommentRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IBlobContainer blobContainer,
            IRepository<TicketAttachment, long> attachmentRepository)
            : base(repository)
        {
            _ticketActivityRepository = ticketActivityRepository;
            _ticketCommentRepository = ticketCommentRepository;
            _userRepository = userRepository;
            _blobContainer = blobContainer;
            _attachmentRepository = attachmentRepository;
        }

        public override async Task<TicketDto> CreateAsync(CreateUpdateTicketDto input)
        {
            var ticket = MapToEntity(input);
            ticket.TicketNo = "TK-" + DateTime.Now.ToString("yyyyMMddHHmmss");
            ticket.Status = TicketStatus.New;

            // Bắt buộc autoSave: true để Database sinh ID trả về cho Ticket
            await Repository.InsertAsync(ticket, autoSave: true);

            var activity = new TicketActivity(
                ticket.Id,
                activityType: "TicketCreated",
                description: "Yêu cầu hỗ trợ đã được tạo mới"
            );
            await _ticketActivityRepository.InsertAsync(activity);

            return MapToGetOutputDto(ticket);
        }

        // =========================================================
        // UPLOAD FILE ĐÍNH KÈM
        // =========================================================
        public async Task UploadAttachmentAsync(UploadAttachmentDto input)
        {
            var bytes = Convert.FromBase64String(input.Base64Content);
            var blobName = $"{Guid.NewGuid()}_{input.FileName}";

            // Lưu file vào Blob Storing
            await _blobContainer.SaveAsync(blobName, bytes);

            // Lưu metadata vào bảng TicketAttachments
            var attachment = new TicketAttachment(
                input.TicketId,
                input.FileName,
                blobName,
                bytes.Length,
                input.ContentType
            );
            await _attachmentRepository.InsertAsync(attachment, autoSave: true);

            // Ghi log vào Timeline
            var activity = new TicketActivity(
                input.TicketId,
                activityType: "FileUploaded",
                description: $"Đã đính kèm tệp: {input.FileName}"
            );
            await _ticketActivityRepository.InsertAsync(activity);
        }

        // =========================================================
        // WORKFLOW & HISTORY: LOGIC CHUYỂN TRẠNG THÁI
        // =========================================================
        public async Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null)
        {
            var ticket = await Repository.GetAsync(ticketId);

            if (ticket.Status == newStatus) return;

            var oldStatus = ticket.Status;
            ticket.Status = newStatus;
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

        // =========================================================
        // COMMENT: LOGIC THÊM BÌNH LUẬN ĐỘC LẬP
        // =========================================================
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

        // =========================================================
        // TIMELINE: TRỘN ACTIVITY VÀ COMMENT
        // =========================================================
        public async Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId)
        {
            // 1. Lấy toàn bộ Activity của Ticket
            var activities = await _ticketActivityRepository.GetListAsync(x => x.TicketId == ticketId);

            // 2. Lấy toàn bộ Comment của Ticket
            var comments = await _ticketCommentRepository.GetListAsync(x => x.TicketId == ticketId);

            var timeline = new List<TicketTimelineDto>();

            // Ép kiểu sang DTO chung
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

            // 3. Lấy thông tin User để hiển thị tên
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

            // 4. Trộn và sắp xếp (Cũ nhất xếp trên cùng)
            return timeline.OrderBy(x => x.CreationTime).ToList();
        }

        // =========================================================
        // LOGIC LỌC DỮ LIỆU TỪ FRONTEND GỬI XUỐNG
        // =========================================================
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

        // =========================================================
        // TÍCH HỢP MAPPERLY
        // =========================================================
        protected override Ticket MapToEntity(CreateUpdateTicketDto createInput)
        {
            var mapper = new ItHelpdeskCreateUpdateTicketDtoToTicketMapper();
            return mapper.Map(createInput);
        }

        protected override void MapToEntity(CreateUpdateTicketDto updateInput, Ticket entity)
        {
            var mapper = new ItHelpdeskCreateUpdateTicketDtoToTicketMapper();
            mapper.Map(updateInput, entity);
        }

        protected override TicketDto MapToGetOutputDto(Ticket entity)
        {
            var mapper = new ItHelpdeskTicketToTicketDtoMapper();
            return mapper.Map(entity);
        }

        protected override TicketDto MapToGetListOutputDto(Ticket entity)
        {
            var mapper = new ItHelpdeskTicketToTicketDtoMapper();
            return mapper.Map(entity);
        }

        // =========================================================
        // PHÂN CÔNG & CHUYỂN TUYẾN XỬ LÝ (ASSIGN / RE-ASSIGN)
        // =========================================================
        public async Task AssignTicketAsync(AssignTicketDto input)
        {
            var ticket = await Repository.GetAsync(input.TicketId);

            var oldAssignee = ticket.AssigneeId;
            var oldTeam = ticket.TeamId;

            ticket.AssigneeId = input.AssigneeId;
            ticket.TeamId = input.TeamId;

            // Nếu chuyển sang trạng thái Assigned (2) nếu đang là New (1)
            if (ticket.Status == TicketStatus.New && (input.AssigneeId.HasValue || input.TeamId.HasValue))
            {
                ticket.Status = TicketStatus.Assigned;
            }

            await Repository.UpdateAsync(ticket);

            // Ghi log vào Timeline
            var activity = new TicketActivity(
                input.TicketId,
                activityType: "TicketAssigned",
                description: $"Đã phân công/chuyển tuyến xử lý ticket (KTV: {input.AssigneeId}, Team: {input.TeamId})",
                oldValue: $"Assignee: {oldAssignee}, Team: {oldTeam}",
                newValue: $"Assignee: {input.AssigneeId}, Team: {input.TeamId}"
            );
            await _ticketActivityRepository.InsertAsync(activity);
        }
    }
}