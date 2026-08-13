using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace ItHelpdesk.EntityFrameworkCore.Connection
{
    public interface IConnectSqlExecute
    {
        Task<IEnumerable<T>> ExecProcedureAsync<T>(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null);

        Task<T?> ExecScalarAsync<T>(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null);

        Task<int> ExecNonQueryAsync(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null);

        Task<int> ExecWithReturnAsync(
            string procedureName,
            object? param = null);

        Task BulkCopyAsync(DataTable table);
    }
}
