using System;

namespace ItHelpdesk.LocalizationManagement.Languages
{
    public class LanguageDto
    {
        public Guid Id { get; set; }
        public string CultureName { get; set; }
        public string DisplayName { get; set; }
        public string Icon { get; set; }
        public bool IsDefault { get; set; }
    }
}
