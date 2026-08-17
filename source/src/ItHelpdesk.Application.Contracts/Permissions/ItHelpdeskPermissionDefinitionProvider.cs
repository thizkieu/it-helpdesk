using ItHelpdesk.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;
using Volo.Abp.MultiTenancy;

namespace ItHelpdesk.Permissions;

public class ItHelpdeskPermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(ItHelpdeskPermissions.GroupName);

        var booksPermission = myGroup.AddPermission(ItHelpdeskPermissions.Books.Default, L("Permission:Books"));
        booksPermission.AddChild(ItHelpdeskPermissions.Books.Create, L("Permission:Books.Create"));
        booksPermission.AddChild(ItHelpdeskPermissions.Books.Edit, L("Permission:Books.Edit"));
        booksPermission.AddChild(ItHelpdeskPermissions.Books.Delete, L("Permission:Books.Delete"));

        var languagesPermission = myGroup.AddPermission(ItHelpdeskPermissions.Languages.Default, L("Permission:Languages"));
        languagesPermission.AddChild(ItHelpdeskPermissions.Languages.Create, L("Permission:Languages.Create"));
        languagesPermission.AddChild(ItHelpdeskPermissions.Languages.Edit, L("Permission:Languages.Edit"));
        languagesPermission.AddChild(ItHelpdeskPermissions.Languages.Delete, L("Permission:Languages.Delete"));

        var languageTextsPermission = myGroup.AddPermission(ItHelpdeskPermissions.LanguageTexts.Default, L("Permission:LanguageTexts"));
        languageTextsPermission.AddChild(ItHelpdeskPermissions.LanguageTexts.Create, L("Permission:LanguageTexts.Create"));
        languageTextsPermission.AddChild(ItHelpdeskPermissions.LanguageTexts.Edit, L("Permission:LanguageTexts.Edit"));
        languageTextsPermission.AddChild(ItHelpdeskPermissions.LanguageTexts.Delete, L("Permission:LanguageTexts.Delete"));

        var sysMasterListsPermission = myGroup.AddPermission(ItHelpdeskPermissions.SysMasterLists.Default, L("Permission:SysMasterLists"));
        sysMasterListsPermission.AddChild(ItHelpdeskPermissions.SysMasterLists.Create, L("Permission:SysMasterLists.Create"));
        sysMasterListsPermission.AddChild(ItHelpdeskPermissions.SysMasterLists.Edit, L("Permission:SysMasterLists.Edit"));
        sysMasterListsPermission.AddChild(ItHelpdeskPermissions.SysMasterLists.Delete, L("Permission:SysMasterLists.Delete"));

        //Define your own permissions here. Example:
        //myGroup.AddPermission(ItHelpdeskPermissions.MyPermission1, L("Permission:MyPermission1"));
        // Category Permissions
        var categoryPermission = myGroup.AddPermission(ItHelpdeskPermissions.Categories.Default, L("Permission:Categories"));
        categoryPermission.AddChild(ItHelpdeskPermissions.Categories.Create, L("Permission:Categories.Create"));
        categoryPermission.AddChild(ItHelpdeskPermissions.Categories.Edit, L("Permission:Categories.Edit"));
        categoryPermission.AddChild(ItHelpdeskPermissions.Categories.Delete, L("Permission:Categories.Delete"));

        // Service Permissions
        var servicePermission = myGroup.AddPermission(ItHelpdeskPermissions.Services.Default, L("Permission:Services"));
        servicePermission.AddChild(ItHelpdeskPermissions.Services.Create, L("Permission:Services.Create"));
        servicePermission.AddChild(ItHelpdeskPermissions.Services.Edit, L("Permission:Services.Edit"));
        servicePermission.AddChild(ItHelpdeskPermissions.Services.Delete, L("Permission:Services.Delete"));

        // Priority Permissions
        var priorityPermission = myGroup.AddPermission(ItHelpdeskPermissions.Priorities.Default, L("Permission:Priorities"));
        priorityPermission.AddChild(ItHelpdeskPermissions.Priorities.Create, L("Permission:Priorities.Create"));
        priorityPermission.AddChild(ItHelpdeskPermissions.Priorities.Edit, L("Permission:Priorities.Edit"));
        priorityPermission.AddChild(ItHelpdeskPermissions.Priorities.Delete, L("Permission:Priorities.Delete"));

        // Team Permissions
        var teamPermission = myGroup.AddPermission(ItHelpdeskPermissions.Teams.Default, L("Permission:Teams"));
        teamPermission.AddChild(ItHelpdeskPermissions.Teams.Create, L("Permission:Teams.Create"));
        teamPermission.AddChild(ItHelpdeskPermissions.Teams.Edit, L("Permission:Teams.Create")); // Sửa lại key cho đúng nếu cần
        teamPermission.AddChild(ItHelpdeskPermissions.Teams.Delete, L("Permission:Teams.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<ItHelpdeskResource>(name);
    }
}
