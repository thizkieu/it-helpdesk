using ItHelpdesk.Localization;
using ItHelpdesk.Permissions;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.LocalizationManagement.LanguageTexts;

[Authorize(ItHelpdeskPermissions.LanguageTexts.Default)]
public class LanguageTextAppService : ApplicationService, ILanguageTextAppService
{
    private readonly IRepository<LanguageText, Guid> _repository;
    private readonly DatabaseLocalizationContributor _dbContributor;

    public LanguageTextAppService(IRepository<LanguageText, Guid> repository, DatabaseLocalizationContributor dbContributor)
    {
        _repository = repository;
        _dbContributor = dbContributor;
    }

    public async Task<LanguageTextDto> GetAsync(Guid id)
    {
        var book = await _repository.GetAsync(id);
        return ObjectMapper.Map<LanguageText, LanguageTextDto>(book);
    }

    public async Task<PagedResultDto<LanguageTextDto>> GetListAsync(PagedAndSortedResultRequestDto input)
    {
        var queryable = await _repository.GetQueryableAsync();
        var query = queryable
            .OrderBy(input.Sorting.IsNullOrWhiteSpace() ? "CreationTime DESC" : input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount);

        var books = await AsyncExecuter.ToListAsync(query);
        var totalCount = await AsyncExecuter.CountAsync(queryable);

        return new PagedResultDto<LanguageTextDto>(
            totalCount,
            ObjectMapper.Map<List<LanguageText>, List<LanguageTextDto>>(books)
        );
    }

    [Authorize(ItHelpdeskPermissions.LanguageTexts.Create)]
    public async Task<LanguageTextDto> CreateAsync(CreateUpdateLanguageTextDto input)
    {
        var book = ObjectMapper.Map<CreateUpdateLanguageTextDto, LanguageText>(input);
        await _repository.InsertAsync(book);
        _dbContributor.InvalidateCache(); //Xóa cache ngôn ngữ
        return ObjectMapper.Map<LanguageText, LanguageTextDto>(book);
    }

    [Authorize(ItHelpdeskPermissions.LanguageTexts.Edit)]
    public async Task<LanguageTextDto> UpdateAsync(Guid id, CreateUpdateLanguageTextDto input)
    {
        var book = await _repository.GetAsync(id);
        ObjectMapper.Map(input, book);
        await _repository.UpdateAsync(book);
        _dbContributor.InvalidateCache(); //Xóa cache ngôn ngữ
        return ObjectMapper.Map<LanguageText, LanguageTextDto>(book);
    }

    [Authorize(ItHelpdeskPermissions.LanguageTexts.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        await _repository.DeleteAsync(id);
    }
}
