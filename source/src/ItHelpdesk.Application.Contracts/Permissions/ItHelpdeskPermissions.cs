namespace ItHelpdesk.Permissions;

public static class ItHelpdeskPermissions
{
    public const string GroupName = "ItHelpdesk";


    public static class Books
    {
        public const string Default = GroupName + ".Books";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    public static class Languages
    {
        public const string Default = GroupName + ".Languages";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    public static class LanguageTexts
    {
        public const string Default = GroupName + ".LanguageTexts";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    public static class SysMasterLists
    {
        public const string Default = GroupName + ".SysMasterLists";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }
    //Add your own permission names. Example:
    //public const string MyPermission1 = GroupName + ".MyPermission1";

    // Phân quyền cho Category
    public static class Categories
    {
        public const string Default = GroupName + ".Categories";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    // Phân quyền cho Service
    public static class Services
    {
        public const string Default = GroupName + ".Services";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    // Phân quyền cho Priority
    public static class Priorities
    {
        public const string Default = GroupName + ".Priorities";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }

    // Phân quyền cho Team
    public static class Teams
    {
        public const string Default = GroupName + ".Teams";
        public const string Create = Default + ".Create";
        public const string Edit = Default + ".Edit";
        public const string Delete = Default + ".Delete";
    }
}
