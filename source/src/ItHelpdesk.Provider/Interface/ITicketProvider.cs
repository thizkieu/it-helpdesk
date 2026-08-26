using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ItHelpdesk.Provider
{
    public interface ITicketProvider
    {
        // 1. Lấy danh sách Ticket (hỗ trợ phân trang, lọc dữ liệu)
        Task<List<TicketListQueryResponse>> GetListAsync(TicketListRequest input);

        // 2. Lấy thông tin chi tiết một Ticket theo ID
        Task<TicketListQueryResponse> GetInfoAsync(TicketInfoRequest input);

        // 3. Thêm mới Ticket
        Task<int> InsertAsync(TicketInsertOrUpdateRequest input);

        // 4. Cập nhật thông tin Ticket
        Task<int> UpdateAsync(TicketInsertOrUpdateRequest input);

        // 5. Xóa Ticket
        Task<int> DeleteAsync(TicketDeleteRequest input);

        // 6. Báo cáo thống kê tổng hợp Ticket
        Task<List<TicketReportResponse>> GetReportSummaryAsync(TicketReportRequest input);
    }
}