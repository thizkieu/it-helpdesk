using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Identity;
using Volo.Abp.ObjectExtending;
using Volo.Abp.Threading;

namespace ItHelpdesk;

public static class ItHelpdeskModuleExtensionConfigurator
{
    private static readonly OneTimeRunner OneTimeRunner = new OneTimeRunner();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            ConfigureExistingProperties();
            ConfigureExtraProperties();
        });
    }

    private static void ConfigureExistingProperties()
    {
        /* You can change max lengths for properties of the
         * entities defined in the modules used by your application.
         *
         * Example: Change user and role name max lengths

           AbpUserConsts.MaxNameLength = 99;
           IdentityRoleConsts.MaxNameLength = 99;

         * Notice: It is not suggested to change property lengths
         * unless you really need it. Go with the standard values wherever possible.
         *
         * If you are using EF Core, you will need to run the add-migration command after your changes.
         */
    }

    private static void ConfigureExtraProperties()
    {
        ObjectExtensionManager.Instance.Modules()
            .ConfigureIdentity(identity =>
            {
                identity.ConfigureUser(user =>
                {
                    // Thêm các trường mở rộng lưu trữ thông tin Sơ yếu lý lịch (CV) & Hồ sơ người dùng
                    user.AddOrUpdateProperty<string>("CV_PhotoUrl", property => { property.Attributes.Add(new StringLengthAttribute(500)); });
                    user.AddOrUpdateProperty<string>("CV_JobTitle", property => { property.Attributes.Add(new StringLengthAttribute(100)); });
                    user.AddOrUpdateProperty<string>("CV_Department", property => { property.Attributes.Add(new StringLengthAttribute(100)); });
                    user.AddOrUpdateProperty<string>("CV_Address", property => { property.Attributes.Add(new StringLengthAttribute(250)); });
                    user.AddOrUpdateProperty<string>("CV_Skills", property => { property.Attributes.Add(new StringLengthAttribute(1000)); });
                    user.AddOrUpdateProperty<string>("CV_Bio", property => { property.Attributes.Add(new StringLengthAttribute(2000)); });
                    user.AddOrUpdateProperty<DateTime?>("CV_DateOfBirth");
                });
            });
    }
}