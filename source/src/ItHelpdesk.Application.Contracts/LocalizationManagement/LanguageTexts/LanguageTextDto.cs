using System;

namespace ItHelpdesk.LocalizationManagement.LanguageTexts
{
    public class LanguageTextDto
    {
        public Guid Id { get; set; }
        public string ResourceName { get; set; }
        public string CultureName { get; set; }
        public string Key { get; set; }
        public string Value { get; set; }
    }
}
