using ItHelpdesk.Localization;
using Volo.Abp.Application.Services;

namespace ItHelpdesk;

/* Inherit your application services from this class.
 */
public abstract class ItHelpdeskAppService : ApplicationService
{
    protected ItHelpdeskAppService()
    {
        LocalizationResource = typeof(ItHelpdeskResource);
    }
}
