using Microsoft.Extensions.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;
using ItHelpdesk.Localization;

namespace ItHelpdesk;

[Dependency(ReplaceServices = true)]
public class ItHelpdeskBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<ItHelpdeskResource> _localizer;

    public ItHelpdeskBrandingProvider(IStringLocalizer<ItHelpdeskResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
