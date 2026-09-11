using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using ItHelpdesk.Users;

namespace ItHelpdesk.Tickets
{
    public interface ITicketAppService : ICrudAppService<
        TicketDto,
        long,
        GetTicketListDto,
        CreateUpdateTicketDto>
    {
        // Cập nhật trạng thái (Workflow)
        Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null);

        // Thêm bình luận (Comment) - Đã thêm tham số parentId
        Task AddCommentAsync(long ticketId, string content, bool isInternal = false, long? parentId = null);

        // Lấy lịch sử Timeline (Trộn Activity và Comment)
        Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId);

        // Upload File đính kèm 
        Task UploadAttachmentAsync(UploadAttachmentDto input);

        // Phân công hoặc chuyển tuyến xử lý ticket
        Task AssignTicketAsync(AssignTicketDto input);

        Task<DashboardStatsDto> GetDashboardStatsAsync();

        //Lấy danh sách nhân sự kỹ thuật (Loại trừ End_User)
        Task<List<UserDto>> GetAssignableTechniciansAsync();
    }
}