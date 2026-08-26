using ItHelpdesk.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.Modularity;
using ItHelpdesk.Provider;

[DependsOn(
    typeof(ItHelpdeskEntityFrameworkCoreModule)
)]
public class ItHelpdeskProvidersModule : AbpModule
{
    public override void ConfigureServices(
        ServiceConfigurationContext context)
    {
        context.Services.AddTransient<ILanguagesProvider, LanguagesProvider>();
        context.Services.AddTransient<ISysMasterListsProvider, SysMasterListsProvider>();
        context.Services.AddTransient<ITicketProvider, TicketProvider>();
    }
}
