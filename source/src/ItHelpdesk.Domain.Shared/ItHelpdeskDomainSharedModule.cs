using ItHelpdesk.Localization;
using Volo.Abp.AuditLogging;
using Volo.Abp.BackgroundJobs;
using Volo.Abp.FeatureManagement;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Localization.ExceptionHandling;
using Volo.Abp.Validation.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.PermissionManagement;
using Volo.Abp.SettingManagement;
using Volo.Abp.VirtualFileSystem;
using Volo.Abp.OpenIddict;
using Volo.Abp.BlobStoring.Database;
using Volo.Abp.TenantManagement;

namespace ItHelpdesk;

[DependsOn(
    typeof(AbpAuditLoggingDomainSharedModule),
    typeof(AbpBackgroundJobsDomainSharedModule),
    typeof(AbpFeatureManagementDomainSharedModule),
    typeof(AbpPermissionManagementDomainSharedModule),
    typeof(AbpSettingManagementDomainSharedModule),
    typeof(AbpIdentityDomainSharedModule),
    typeof(AbpOpenIddictDomainSharedModule),
    typeof(AbpTenantManagementDomainSharedModule),
    typeof(BlobStoringDatabaseDomainSharedModule),
    typeof(AbpLocalizationModule)
)]
public class ItHelpdeskDomainSharedModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        ItHelpdeskGlobalFeatureConfigurator.Configure();
        ItHelpdeskModuleExtensionConfigurator.Configure();
    }

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        // 1. Nhúng toàn bộ thư mục Localization vào hệ thống ảo của Backend
        Configure<AbpVirtualFileSystemOptions>(options =>
        {
            options.FileSets.AddEmbedded<ItHelpdeskDomainSharedModule>("ItHelpdesk");
        });

        // 2. Đăng ký tài nguyên đa ngôn ngữ và khai báo cả 2 ngôn ngữ vi, en
        Configure<AbpLocalizationOptions>(options =>
        {
            options.Resources
                .Add<ItHelpdeskResource>("vi") // Mặc định ưu tiên tiếng Việt
                .AddBaseTypes(typeof(AbpValidationResource))
                .AddVirtualJson("/Localization/ItHelpdesk"); // Tự động quét cả file vi.json và en.json trong thư mục này

            options.DefaultResourceType = typeof(ItHelpdeskResource);

            // Khai báo rõ ràng danh sách các ngôn ngữ hệ thống hỗ trợ hai chiều
            options.Languages.Add(new LanguageInfo("vi", "vi", "Vietnamese"));
            options.Languages.Add(new LanguageInfo("en", "en", "English"));
        });

        Configure<AbpExceptionLocalizationOptions>(options =>
        {
            options.MapCodeNamespace("ItHelpdesk", typeof(ItHelpdeskResource));
        });
    }
}