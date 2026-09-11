using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.ExtendedUsers
{
    // Interface kế thừa IApplicationService để ABP tự động gen API
    public interface IExtendedUserAppService : IApplicationService
    {
        Task<PagedResultDto<ExtendedUserDto>> GetListAsync(GetExtendedUserListInput input);
    }
}