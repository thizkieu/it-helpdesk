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
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<ItHelpdeskResource>(name);
    }
}
