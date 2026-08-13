using System.Threading.Tasks;

namespace ItHelpdesk.Data;

public interface IItHelpdeskDbSchemaMigrator
{
    Task MigrateAsync();
}
