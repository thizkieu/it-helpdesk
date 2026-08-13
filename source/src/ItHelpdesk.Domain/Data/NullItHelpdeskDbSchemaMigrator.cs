using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace ItHelpdesk.Data;

/* This is used if database provider does't define
 * IItHelpdeskDbSchemaMigrator implementation.
 */
public class NullItHelpdeskDbSchemaMigrator : IItHelpdeskDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
