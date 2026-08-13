using ItHelpdesk.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace ItHelpdesk.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(ItHelpdeskEntityFrameworkCoreModule),
    typeof(ItHelpdeskApplicationContractsModule)
)]
public class ItHelpdeskDbMigratorModule : AbpModule
{
}
