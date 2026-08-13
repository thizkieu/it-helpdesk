using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ItHelpdesk.Data;
using Volo.Abp.DependencyInjection;

namespace ItHelpdesk.EntityFrameworkCore;

public class EntityFrameworkCoreItHelpdeskDbSchemaMigrator
    : IItHelpdeskDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreItHelpdeskDbSchemaMigrator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolving the ItHelpdeskDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<ItHelpdeskDbContext>()
            .Database
            .MigrateAsync();
    }
}
