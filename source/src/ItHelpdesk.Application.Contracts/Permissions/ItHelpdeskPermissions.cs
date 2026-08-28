namespace ItHelpdesk.Permissions
{
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

        public static class Categories
        {
            public const string Default = GroupName + ".Categories";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class Services
        {
            public const string Default = GroupName + ".Services";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class Priorities
        {
            public const string Default = GroupName + ".Priorities";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class Teams
        {
            public const string Default = GroupName + ".Teams";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class Tickets
        {
            public const string Default = GroupName + ".Tickets";
            public const string Create = Default + ".Create";
            public const string Edit = Default + ".Edit";
            public const string Delete = Default + ".Delete";
        }

        public static class Dashboard
        {
            public const string Default = GroupName + ".Dashboard";
        }

        public static class KnowledgeBase
        {
            public const string Default = GroupName + ".KnowledgeBase";
        }

        // PHÂN QUYỀN TRUY CẬP QUẢN LÝ NGƯỜI DÙNG CUSTOM
        public static class UserManagement
        {
            public const string Default = GroupName + ".UserManagement";
        }
    }
}