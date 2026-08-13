using ItHelpdesk.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace ItHelpdesk.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class ItHelpdeskController : AbpControllerBase
{
    protected ItHelpdeskController()
    {
        LocalizationResource = typeof(ItHelpdeskResource);
    }
}
