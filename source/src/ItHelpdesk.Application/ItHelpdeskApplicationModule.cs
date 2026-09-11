using Volo.Abp.Account;
using Volo.Abp.BlobStoring;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;
using Volo.Abp.BlobStoring.Database;
using Volo.Abp; 
using Volo.Abp.BackgroundWorkers; 
using ItHelpdesk.Workers; 

namespace ItHelpdesk;

[DependsOn(
    typeof(ItHelpdeskDomainModule),
    typeof(ItHelpdeskApplicationContractsModule),
    typeof(AbpPermissionManagementApplicationModule),
    typeof(AbpFeatureManagementApplicationModule),
    typeof(AbpIdentityApplicationModule),
    typeof(AbpAccountApplicationModule),
    typeof(AbpTenantManagementApplicationModule),
    typeof(AbpSettingManagementApplicationModule),
    typeof(ItHelpdeskProvidersModule)
)]
public class ItHelpdeskApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // 2. Cấu hình Blob Storing lưu vào Database ở đây
        Configure<AbpBlobStoringOptions>(options =>
        {
            options.Containers.ConfigureDefault(container =>
            {
                container.UseDatabase();
            });
        });
    }

    // HÀM NÀY ĐỂ KÍCH HOẠT WORKER CHẠY NGẦM KHI START APP
    public override void OnApplicationInitialization(ApplicationInitializationContext context)
    {
        base.OnApplicationInitialization(context);

        // Đăng ký bộ đếm giờ theo dõi SLA
        context.AddBackgroundWorkerAsync<SlaTrackingWorker>();
    }
}