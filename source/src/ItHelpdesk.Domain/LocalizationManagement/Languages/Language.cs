using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.LocalizationManagement.Languages;

public class Language : AuditedAggregateRoot<Guid>
{
    public string CultureName { get; set; }   // vi, en
    public string DisplayName { get; set; }   // Tiếng Việt
    public string Icon { get; set; }          // vn, gb
    public bool IsDefault { get; set; }

    public Language() { }
}
