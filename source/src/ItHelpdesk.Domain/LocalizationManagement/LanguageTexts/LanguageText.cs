using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.LocalizationManagement.LanguageTexts;

public class LanguageText : AuditedAggregateRoot<Guid>
{
    public string ResourceName { get; set; }
    public string CultureName { get; set; }
    public string Key { get; set; }
    public string Value { get; set; }

    public LanguageText() { }
}
