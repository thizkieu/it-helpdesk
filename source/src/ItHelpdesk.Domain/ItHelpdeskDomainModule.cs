using ItHelpdesk.MultiTenancy;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using Volo.Abp; // Bắt buộc phải có thư viện này cho ApplicationInitializationContext
using Volo.Abp.AuditLogging;
using Volo.Abp.BackgroundJobs;
using Volo.Abp.BlobStoring.Database;
using Volo.Abp.Caching;
using Volo.Abp.Emailing;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.MultiTenancy;
using Volo.Abp.OpenIddict;
using Volo.Abp.PermissionManagement.Identity;
using Volo.Abp.PermissionManagement.OpenIddict;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;
using Volo.Abp.BackgroundWorkers; // Thêm thư viện để gọi AddBackgroundWorkerAsync
using ItHelpdesk.Workers; // Gọi thư mục chứa SlaMonitorWorker

namespace ItHelpdesk;

[DependsOn(
    typeof(ItHelpdeskDomainSharedModule),
    typeof(AbpAuditLoggingDomainModule),
    typeof(AbpCachingModule),
    typeof(AbpBackgroundJobsDomainModule),
    typeof(AbpFeatureManagementDomainModule),
    typeof(AbpPermissionManagementDomainIdentityModule),
    typeof(AbpPermissionManagementDomainOpenIddictModule),
    typeof(AbpSettingManagementDomainModule),
    typeof(AbpEmailingModule),
    typeof(AbpIdentityDomainModule),
    typeof(AbpOpenIddictDomainModule),
    typeof(AbpTenantManagementDomainModule),
    typeof(BlobStoringDatabaseDomainModule)
    )]
public class ItHelpdeskDomainModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpMultiTenancyOptions>(options =>
        {
            options.IsEnabled = MultiTenancyConsts.IsEnabled;
        });
#if DEBUG
        context.Services.Replace(ServiceDescriptor.Singleton<IEmailSender, NullEmailSender>());
#endif
    }

    // ĐÂY LÀ HÀM THÊM VÀO ĐỂ KHỞI CHẠY WORKER SLA
    public override void OnApplicationInitialization(ApplicationInitializationContext context)
    {
        context.AddBackgroundWorkerAsync<SlaMonitorWorker>();
    }
}