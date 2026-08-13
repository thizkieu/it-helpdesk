using ItHelpdesk.EntityFrameworkCore.Connection;
using Microsoft.Extensions.Logging;

namespace ItHelpdesk.Provider
{
    public class SysMasterListsProvider : ISysMasterListsProvider
    {
        private readonly IConnectSqlExecute _sql;
        private readonly ILogger<SysMasterListsProvider> _logger; //Dùng log nếu cần thiết

        public SysMasterListsProvider(
            IConnectSqlExecute sql,
            ILogger<SysMasterListsProvider> logger)
        {
            _sql = sql;
            _logger = logger;
        }
        public async Task<List<PageSysMasterListQueryResponse>> GetListAsync(SysMasterListRequest input)
        {
            var result = await _sql.ExecProcedureAsync<PageSysMasterListQueryResponse>("sp_SysMasterLists_GetList_V01", input);
            return result.ToList();
        }

        public async Task<InfoSysMasterListQueryResponse> GetInfoAsync(SysMasterListInfoRequest input)
        {
            var result = await _sql.ExecProcedureAsync<InfoSysMasterListQueryResponse>("sp_SysMasterLists_GetInfo_V01", input);
            return result?.FirstOrDefault() ?? new InfoSysMasterListQueryResponse();
        }

        public async Task<List<SysMasterListQueryResponse>> GetAllCdeAsync(SysMasterListAllCdeRequest input)
        {
            var result = await _sql.ExecProcedureAsync<SysMasterListQueryResponse>("sp_SysMasterLists_GetAllCode_V01", input);
            return result.ToList();
        }

        public async Task<int> InsertAsync(SysMasterListInsertOrUpdateRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_SysMasterLists_Insert_V01", input);
            return result;
        }

        public async Task<int> UpdateAsync(SysMasterListInsertOrUpdateRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_SysMasterLists_Update_V01", input);
            return result;
        }

        public async Task<int> DeleteAsync(SysMasterListDeleteRequest input)
        {
            var result = await _sql.ExecWithReturnAsync("sp_SysMasterLists_Delete_V01", input);
            return result;
        }

        /*
            Case 1 – SP đơn giản (80%)
            var users = await _sql.ExecProcedureAsync<UserQueryDto>(
                "sp_GetUsers",
                new { Status = 1, Role = "Admin" });

            Case 2 – Có output param (20%)
            int total = 0;

            var result = await _sql.ExecProcedureAsync<UserQueryDto>(
                "sp_GetUsersPaging",
                new { Page = 1, PageSize = 20 },
                p => p.AddOutput<int>("@Total", DbType.Int32));

            total = p.Get<int>("@Total");

            Case 3 – NonQuery + return value
        await _sql.ExecNonQueryAsync(
            "sp_DeleteUser",
            new { UserId = id },
            p => p.Add(
                "@ReturnValue",
                dbType: DbType.Int32,
                direction: ParameterDirection.ReturnValue));
         */
    }
}
