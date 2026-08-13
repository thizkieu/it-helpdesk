using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.SysMasterLists;

public interface ISysMasterListAppService : Abp.Application.Services.IApplicationService
{
    Task<PagedResultDto<SysMasterListDto>> GetListAsync(GetSysMasterListInput input);
    Task<SysMasterListDto> GetByIdAsync(long masterListId);
    Task<List<SysMasterListDto>> GetAllCdeAsync(string? masterListGroupCde);
    Task<int> CreateAsync(CreateUpdateSysMasterListDto input);
    Task<int> UpdateAsync(CreateUpdateSysMasterListDto input);
    Task<int> DeleteAsync(DeleteSysMasterListDto input);
}