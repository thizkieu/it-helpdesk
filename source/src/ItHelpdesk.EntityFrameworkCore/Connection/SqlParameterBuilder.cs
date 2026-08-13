using Dapper;
using System.Data;
using System.Reflection;

namespace ItHelpdesk.EntityFrameworkCore.Connection
{
    public class SqlParameterBuilder
    {
        internal DynamicParameters Parameters { get; }
            = new DynamicParameters();

        /// <summary>
        /// Thêm 1 param thủ công
        /// </summary>
        public SqlParameterBuilder Add(
            string name,
            object? value,
            DbType? dbType = null,
            ParameterDirection direction = ParameterDirection.Input)
        {
            Parameters.Add(name, value, dbType, direction);
            return this;
        }

        public SqlParameterBuilder AddReturn<T>(string name, DbType dbType)
        {
            Parameters.Add(
                name,
                value: null,
                dbType: dbType,
                direction: ParameterDirection.ReturnValue);
            return this;
        }

        /// <summary>
        /// Thêm output param
        /// </summary>
        public SqlParameterBuilder AddOutput<T>(
            string name,
            DbType dbType)
        {
            Parameters.Add(
                name,
                dbType: dbType,
                direction: ParameterDirection.Output);
            return this;
        }

        /// <summary>
        /// Auto-map từ object (Cách 2)
        /// </summary>
        public SqlParameterBuilder AddFromObject(object obj)
        {
            if (obj == null) return this;

            foreach (PropertyInfo prop in obj.GetType().GetProperties())
            {
                var value = prop.GetValue(obj);
                Parameters.Add("@" + prop.Name, value);
            }

            return this;
        }

        /// <summary>
        /// Lấy output value
        /// </summary>
        public T Get<T>(string name)
            => Parameters.Get<T>(name);
    }
}
