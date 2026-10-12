using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using ItHelpdesk.Users;

namespace ItHelpdesk.Tickets
{
    // ĐƯA CLASS NÀY SANG ĐÂY ĐỂ INTERFACE HIỂU ĐƯỢC
    public class GetDashboardStatsInput
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public Guid? AssigneeId { get; set; }
        public TicketStatus? Status { get; set; }
        public long? TeamId { get; set; }
    }

    public interface ITicketAppService : ICrudAppService<
        TicketDto,
        long,
        GetTicketListDto,
        CreateUpdateTicketDto>
    {
        // Cập nhật trạng thái (Workflow)
        Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null);

        // Thêm bình luận (Comment)
        Task AddCommentAsync(long ticketId, string content, bool isInternal = false, long? parentId = null);

        // Lấy lịch sử Timeline (Trộn Activity và Comment)
        Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId);

        // Upload File đính kèm 
        Task UploadAttachmentAsync(UploadAttachmentDto input);

        // Phân công hoặc chuyển tuyến xử lý ticket
        Task AssignTicketAsync(AssignTicketDto input);

        // ĐÃ KHỚP HỢP ĐỒNG API
        Task<DashboardStatsDto> GetDashboardStatsAsync(GetDashboardStatsInput input);

        // Lấy danh sách nhân sự kỹ thuật (Loại trừ End_User)
        Task<List<UserDto>> GetAssignableTechniciansAsync();
    }
}