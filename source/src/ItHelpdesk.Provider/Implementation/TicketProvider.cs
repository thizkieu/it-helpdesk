using ItHelpdesk.EntityFrameworkCore.Connection;
using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ItHelpdesk.Provider
{
    public class TicketProvider : ITicketProvider
    {
        // Interface thực thi SQL thuần nội bộ của team bạn
        private readonly IConnectSqlExecute _sql;
        private readonly ILogger<TicketProvider> _logger;

        public TicketProvider(IConnectSqlExecute sql, ILogger<TicketProvider> logger)
        {
            _sql = sql;
            _logger = logger;
        }

        // 1. Lấy danh sách Ticket (hỗ trợ phân trang, tìm kiếm)
        public async Task<List<TicketListQueryResponse>> GetListAsync(TicketListRequest input)
        {
            var result = await _sql.ExecProcedureAsync<TicketListQueryResponse>("sp_Ticket_GetList_V01", input);
            return result.ToList();
        }

        // 2. Lấy thông tin chi tiết 1 Ticket theo ID
        public async Task<TicketListQueryResponse> GetInfoAsync(TicketInfoRequest input)
        {
            var result = await _sql.ExecProcedureAsync<TicketListQueryResponse>("sp_Ticket_GetInfo_V01", input);
            return result.FirstOrDefault() ?? new TicketListQueryResponse();
        }

        // 3. Thêm mới Ticket
        public async Task<int> InsertAsync(TicketInsertOrUpdateRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_Ticket_Insert_V01", input);
            return result;
        }

        // 4. Cập nhật Ticket
        public async Task<int> UpdateAsync(TicketInsertOrUpdateRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_Ticket_Update_V01", input);
            return result;
        }

        // 5. Xóa Ticket
        public async Task<int> DeleteAsync(TicketDeleteRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_Ticket_Delete_V01", input);
            return result;
        }

        // 6. Báo cáo thống kê tổng hợp Ticket
        public async Task<List<TicketReportResponse>> GetReportSummaryAsync(TicketReportRequest input)
        {
            var result = await _sql.ExecProcedureAsync<TicketReportResponse>("sp_Report_TicketSummary_V01", input);
            return result.ToList();
        }
    }
}