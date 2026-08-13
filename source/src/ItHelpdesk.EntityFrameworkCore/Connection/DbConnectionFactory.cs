using Microsoft.Data.SqlClient;
using System.Data;

namespace ItHelpdesk.EntityFrameworkCore.Connection
{
    public interface IDbConnectionFactory
    {
        IDbConnection Create();
    }

    public class DbConnectionFactory : IDbConnectionFactory
    {
        private readonly string _connectionString;

        public DbConnectionFactory(string connectionString)
        {
            _connectionString = connectionString;
        }

        public IDbConnection Create()
            => new SqlConnection(_connectionString);
    }
}
