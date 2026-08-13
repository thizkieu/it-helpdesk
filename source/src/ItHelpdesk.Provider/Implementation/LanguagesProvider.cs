using ItHelpdesk.EntityFrameworkCore.Connection;
using Microsoft.Extensions.Logging;

namespace ItHelpdesk.Provider
{
    public class LanguagesProvider : ILanguagesProvider
    {
        private readonly IConnectSqlExecute _sql;
        private readonly ILogger<LanguagesProvider> _logger;

        public LanguagesProvider(
            IConnectSqlExecute sql,
            ILogger<LanguagesProvider> logger)
        {
            _sql = sql;
            _logger = logger;
        }
        public async Task<List<LanguageQueryResponse>> GetLanguagessAsync(LanguageRequest input)
        {
            var result = await _sql.ExecProcedureAsync<LanguageQueryResponse>("sp_AppLanguages_GetList", input);
            return result.ToList();
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
