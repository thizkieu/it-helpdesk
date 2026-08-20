using Volo.Abp.Account;
using Volo.Abp.BlobStoring; // 1. Thêm namespace này vào đầu file
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.TenantManagement;
using Volo.Abp.BlobStoring.Database;

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
        // 2. Thêm cấu hình Blob Storing lưu vào Database ở đây
        Configure<AbpBlobStoringOptions>(options =>
        {
            options.Containers.ConfigureDefault(container =>
            {
                container.UseDatabase();
            });
        });
    }
}