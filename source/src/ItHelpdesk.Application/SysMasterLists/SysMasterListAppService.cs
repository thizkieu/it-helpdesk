using ItHelpdesk.Permissions;
using ItHelpdesk.Provider;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.SysMasterLists;

[Authorize(ItHelpdeskPermissions.SysMasterLists.Default)]
public class SysMasterListAppService : ApplicationService, ISysMasterListAppService
{
    private readonly ISysMasterListsProvider _provider;

    public SysMasterListAppService(ISysMasterListsProvider provider)
    {
        _provider = provider;
    }

    public async Task<PagedResultDto<SysMasterListDto>> GetListAsync(GetSysMasterListInput input)
    {
        var sysMasterList = ObjectMapper.Map<GetSysMasterListInput, SysMasterListRequest>(input);
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();
        var result = await _provider.GetListAsync(sysMasterList);

        var totalCount = result?.FirstOrDefault()?.TotalRows ?? 0;

        return new PagedResultDto<SysMasterListDto>(
            totalCount,
            ObjectMapper.Map<List<PageSysMasterListQueryResponse>, List<SysMasterListDto>>(result)
        );
    }

    public async Task<SysMasterListDto> GetByIdAsync(long masterListId)
    {
        var result = await _provider.GetInfoAsync(new SysMasterListInfoRequest() { MasterListID = masterListId, TenantId = CurrentTenant.Id?.ToString() });
        return ObjectMapper.Map<InfoSysMasterListQueryResponse, SysMasterListDto>(result);
    }

    public async Task<List<SysMasterListDto>> GetAllCdeAsync(string? masterListGroupCde)
    {
        var result = await _provider.GetAllCdeAsync(new SysMasterListAllCdeRequest() { MasterListGroupCde = masterListGroupCde, TenantId = CurrentTenant.Id?.ToString() });

        return ObjectMapper.Map<List<SysMasterListQueryResponse>, List<SysMasterListDto>>(result);
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Create)]
    public async Task<int> CreateAsync(CreateUpdateSysMasterListDto input)
    {
        var sysMasterList = ObjectMapper.Map<CreateUpdateSysMasterListDto, SysMasterListInsertOrUpdateRequest>(input);
        sysMasterList.CreateBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();
        var result = await _provider.InsertAsync(sysMasterList);
        return result;
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Edit)]
    public async Task<int> UpdateAsync(CreateUpdateSysMasterListDto input)
    {
        var sysMasterList = ObjectMapper.Map<CreateUpdateSysMasterListDto, SysMasterListInsertOrUpdateRequest>(input);
        sysMasterList.ModifiedBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();
        var result = await _provider.UpdateAsync(sysMasterList);
        return result;
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Delete)]
    public async Task<int> DeleteAsync(DeleteSysMasterListDto input)
    {
        var sysMasterList = ObjectMapper.Map<DeleteSysMasterListDto, SysMasterListDeleteRequest>(input);
        sysMasterList.ModifiedBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();
        var result = await _provider.DeleteAsync(sysMasterList);
        return result;
    }
}
