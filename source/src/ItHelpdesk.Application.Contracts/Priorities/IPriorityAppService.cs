using Volo.Abp.Application.Services;

namespace ItHelpdesk.Priorities
{
    public interface IPriorityAppService : ICrudAppService<PriorityDto, long, GetPriorityListInput, CreateUpdatePriorityDto>
    {
    }
}