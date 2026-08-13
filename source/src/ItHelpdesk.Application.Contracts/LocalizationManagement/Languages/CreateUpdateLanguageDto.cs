namespace ItHelpdesk.LocalizationManagement.Languages
{
    public class CreateUpdateLanguageDto
    {
        public string CultureName { get; set; }   // vi, en
        public string DisplayName { get; set; }   // Tiếng Việt
        public string Icon { get; set; }          // vn, gb
        public bool IsDefault { get; set; }
    }

}
