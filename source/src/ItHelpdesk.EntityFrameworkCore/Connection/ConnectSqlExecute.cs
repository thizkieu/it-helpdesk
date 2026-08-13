using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text.Json;
using System.Threading.Tasks;

namespace ItHelpdesk.EntityFrameworkCore.Connection
{
    public class ConnectSqlExecute : IConnectSqlExecute
    {
        private readonly IDbConnectionFactory _connectionFactory;
        private readonly ILogger<ConnectSqlExecute> _logger;

        private const string LogFormat =
            "Procedure: {Procedure}, Params: {Params}";

        public ConnectSqlExecute(
            IDbConnectionFactory connectionFactory,
            ILogger<ConnectSqlExecute> logger)
        {
            _connectionFactory = connectionFactory;
            _logger = logger;
        }

        #region Execute Procedure

        public async Task<IEnumerable<T>> ExecProcedureAsync<T>(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null)
        {
            try
            {
                using var conn = _connectionFactory.Create();

                var builder = BuildParameters(param, advanced);

                return await conn.QueryAsync<T>(
                    procedureName,
                    builder.Parameters,
                    commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                LogError(ex, procedureName, param);
                throw;
            }
        }

        #endregion

        #region Scalar

        public async Task<T?> ExecScalarAsync<T>(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null)
        {
            try
            {
                using var conn = _connectionFactory.Create();

                var builder = BuildParameters(param, advanced);

                return await conn.ExecuteScalarAsync<T>(
                    procedureName,
                    builder.Parameters,
                    commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                LogError(ex, procedureName, param);
                throw;
            }
        }

        #endregion

        #region Update / Insert

        public async Task<int> ExecNonQueryAsync(
            string procedureName,
            object? param = null,
            Action<SqlParameterBuilder>? advanced = null)
        {
            try
            {
                using var conn = _connectionFactory.Create();

                var builder = BuildParameters(param, advanced);

                return await conn.ExecuteAsync(
                    procedureName,
                    builder.Parameters,
                    commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                LogError(ex, procedureName, param);
                throw;
            }
        }

        public async Task<int> ExecNonQueryAsync(
            string procedureName,
            object? param,
            SqlParameterBuilder builder)
        {
            try
            {
                using var conn = _connectionFactory.Create();

                // chỉ build param object → merge vào builder
                BuildParameters(param, builder);

                return await conn.ExecuteAsync(
                    procedureName,
                    builder.Parameters,
                    commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                LogError(ex, procedureName, param);
                throw;
            }
        }

        public async Task<int> ExecWithReturnAsync(
            string procedureName,
            object? param = null)
        {
            var builder = new SqlParameterBuilder();

            builder.Add(
                "@ReturnValue",
                null,
                DbType.Int32,
                ParameterDirection.ReturnValue);

            await ExecNonQueryAsync(
                procedureName,
                param,
                builder);

            return builder.Get<int>("@ReturnValue");
        }

        #endregion

        #region DataTable

        public async Task<DataTable> ExecDataTableAsync(
            string procedureName,
            object? param = null)
        {
            try
            {
                using var conn = _connectionFactory.Create();
                using var reader = await conn.ExecuteReaderAsync(
                    procedureName,
                    param,
                    commandType: CommandType.StoredProcedure);

                var table = new DataTable();
                table.Load(reader);
                return table;
            }
            catch (Exception ex)
            {
                LogError(ex, procedureName, param);
                throw;
            }
        }

        #endregion

        #region Bulk Copy

        public async Task BulkCopyAsync(DataTable table)
        {
            await using var connection =
                (SqlConnection)_connectionFactory.Create();

            await connection.OpenAsync();

            using var bulkCopy = new SqlBulkCopy(connection)
            {
                DestinationTableName = table.TableName
            };

            await bulkCopy.WriteToServerAsync(table);
        }

        #endregion

        #region Logging

        private void LogError(
            Exception ex,
            string procedureName,
            object? param)
        {
            var json = JsonSerializer.Serialize(param);

            _logger.LogError(
                ex,
                LogFormat,
                procedureName,
                json);
        }

        #endregion

        private SqlParameterBuilder BuildParameters(
            object? param,
            Action<SqlParameterBuilder>? advanced)
        {
            var builder = new SqlParameterBuilder();

            if (param != null)
            {
                builder.AddFromObject(param);
            }

            advanced?.Invoke(builder);

            return builder;
        }

        private void BuildParameters(
            object? param,
            SqlParameterBuilder builder)
        {
            if (param != null)
            {
                builder.Parameters.AddDynamicParams(param);
            }
        }
    }
}
