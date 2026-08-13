using ItHelpdesk.Permissions;
using ItHelpdesk.Provider;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.ObjectMapping;

namespace ItHelpdesk.LocalizationManagement.Languages
{
    [Authorize(ItHelpdeskPermissions.Languages.Default)]
    public class LanguageAppService : ApplicationService, ILanguageAppService
    {
        private readonly IRepository<Language, Guid> _repository;
        private readonly ILanguagesProvider _languagesProvider;

        public LanguageAppService(IRepository<Language, Guid> repository, ILanguagesProvider lanuageProvider)
        {
            _repository = repository;
            _languagesProvider = lanuageProvider;
        }

        public async Task<LanguageDto> GetAsync(Guid id)
        {
            var language = await _repository.GetAsync(id);
            return ObjectMapper.Map<Language, LanguageDto>(language);
        }

        public async Task<PagedResultDto<LanguageDto>> GetListAsync(PagedAndSortedResultRequestDto input)
        {
            try
            {
                var queryable = await _repository.GetQueryableAsync();
                var query = queryable
                    //.OrderBy(input.Sorting.IsNullOrWhiteSpace() ? "Name" : input.Sorting)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount);

                var languages = await AsyncExecuter.ToListAsync(query);
                var totalCount = await AsyncExecuter.CountAsync(queryable);

                var result = ObjectMapper.Map<List<Language>, List<LanguageDto>>(languages);
                return new PagedResultDto<LanguageDto>(
                    totalCount,
                    result ?? new List<LanguageDto>()
                );
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public async Task<PagedResultDto<LanguageDto>> GetLanguagesAsync(InputLanguageDto input)
        {
            var _input = ObjectMapper.Map<InputLanguageDto, LanguageRequest>(input);
            var languages = await _languagesProvider.GetLanguagessAsync(_input);
            var result = ObjectMapper.Map<List<LanguageQueryResponse>, List<LanguageDto>>(languages);
            var totalCount = result?.Count ?? 0;
            return new PagedResultDto<LanguageDto>(
                    totalCount,
                    result ?? new List<LanguageDto>()
                );
        }

        [Authorize(ItHelpdeskPermissions.Languages.Create)]
        public async Task<LanguageDto> CreateAsync(CreateUpdateLanguageDto input)
        {
            var language = ObjectMapper.Map<CreateUpdateLanguageDto, Language>(input);
            await _repository.InsertAsync(language);
            return ObjectMapper.Map<Language, LanguageDto>(language);
        }

        [Authorize(ItHelpdeskPermissions.Languages.Edit)]
        public async Task<LanguageDto> UpdateAsync(Guid id, CreateUpdateLanguageDto input)
        {
            var language = await _repository.GetAsync(id);
            ObjectMapper.Map(input, language);
            await _repository.UpdateAsync(language);
            return ObjectMapper.Map<Language, LanguageDto>(language);
        }

        [Authorize(ItHelpdeskPermissions.Languages.Delete)]
        public async Task DeleteAsync(Guid id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}
