using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.LocalizationManagement.Languages
{
    public interface ILanguageAppService :
    ICrudAppService<LanguageDto, Guid, PagedAndSortedResultRequestDto, CreateUpdateLanguageDto>
    {
        Task<PagedResultDto<LanguageDto>> GetLanguagesAsync(InputLanguageDto input);
    }
}
