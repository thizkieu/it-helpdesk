using ItHelpdesk.Localization;
using ItHelpdesk.Permissions;
using ItHelpdesk.Provider;
using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.SysMasterLists;

[Authorize(ItHelpdeskPermissions.SysMasterLists.Default)]
public class SysMasterListAppService : ApplicationService, ISysMasterListAppService
{
    private readonly ISysMasterListsProvider _provider;
    private readonly IStringLocalizer<ItHelpdeskResource> _localizer;

    public SysMasterListAppService(
        ISysMasterListsProvider provider,
        IStringLocalizer<ItHelpdeskResource> localizer) // INJECT BỔ SUNG LOCALIZER
    {
        _provider = provider;
        _localizer = localizer;
    }

    public async Task<PagedResultDto<SysMasterListDto>> GetListAsync(GetSysMasterListInput input)
    {
        try
        {
            var sysMasterList = ObjectMapper.Map<GetSysMasterListInput, SysMasterListRequest>(input);
            sysMasterList.TenantId = CurrentTenant.Id?.ToString();

            var result = await _provider.GetListAsync(sysMasterList);

            // BẢO VỆ: Chống lỗi văng Null Reference khi SP không có data
            if (result == null || !result.Any())
            {
                return new PagedResultDto<SysMasterListDto>(0, new List<SysMasterListDto>());
            }

            var totalCount = result.FirstOrDefault()?.TotalRows ?? 0;

            return new PagedResultDto<SysMasterListDto>(
                totalCount,
                ObjectMapper.Map<List<PageSysMasterListQueryResponse>, List<SysMasterListDto>>(result)
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SysMasterListAppService GETLIST ERROR]: {ex.Message}");
            throw new UserFriendlyException(_localizer["Error:Generic"]);
        }
    }

    public async Task<SysMasterListDto> GetByIdAsync(long masterListId)
    {
        var result = await _provider.GetInfoAsync(new SysMasterListInfoRequest()
        {
            MasterListID = masterListId,
            TenantId = CurrentTenant.Id?.ToString()
        });

        // BẢO VỆ: Nếu không tìm thấy, ném lỗi đa ngôn ngữ thân thiện
        if (result == null || result.MasterListID == 0)
        {
            throw new UserFriendlyException(_localizer["Error:NotFound"]);
        }

        return ObjectMapper.Map<InfoSysMasterListQueryResponse, SysMasterListDto>(result);
    }

    // Mở [AllowAnonymous] nội bộ (hoặc bỏ Require Permission) để các AppService khác (như Ticket) có thể gọi lấy cấu hình Ngày lễ dễ dàng
    public async Task<List<SysMasterListDto>> GetAllCdeAsync(string? masterListGroupCde)
    {
        var result = await _provider.GetAllCdeAsync(new SysMasterListAllCdeRequest()
        {
            MasterListGroupCde = masterListGroupCde,
            TenantId = CurrentTenant.Id?.ToString()
        });

        if (result == null || !result.Any())
        {
            return new List<SysMasterListDto>();
        }

        return ObjectMapper.Map<List<SysMasterListQueryResponse>, List<SysMasterListDto>>(result);
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Create)]
    public async Task<int> CreateAsync(CreateUpdateSysMasterListDto input)
    {
        if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

        var sysMasterList = ObjectMapper.Map<CreateUpdateSysMasterListDto, SysMasterListInsertOrUpdateRequest>(input);
        sysMasterList.CreateBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();

        return await _provider.InsertAsync(sysMasterList);
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Edit)]
    public async Task<int> UpdateAsync(CreateUpdateSysMasterListDto input)
    {
        if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

        var sysMasterList = ObjectMapper.Map<CreateUpdateSysMasterListDto, SysMasterListInsertOrUpdateRequest>(input);
        sysMasterList.ModifiedBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();

        return await _provider.UpdateAsync(sysMasterList);
    }

    [Authorize(ItHelpdeskPermissions.SysMasterLists.Delete)]
    public async Task<int> DeleteAsync(DeleteSysMasterListDto input)
    {
        if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

        var sysMasterList = ObjectMapper.Map<DeleteSysMasterListDto, SysMasterListDeleteRequest>(input);
        sysMasterList.ModifiedBy = CurrentUser.Id?.ToString();
        sysMasterList.TenantId = CurrentTenant.Id?.ToString();

        return await _provider.DeleteAsync(sysMasterList);
    }
}