using Volo.Abp.Application.Services;

namespace ItHelpdesk.Services
{
    public interface IServiceAppService : ICrudAppService<
        ServiceDto,
        long,
        GetServiceListInput,
        CreateUpdateServiceDto>
    {
    }
}