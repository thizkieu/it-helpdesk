using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.KnowledgeBase
{
    public interface IFaqItemAppService : ICrudAppService<
        FaqItemDto,
        long,
        PagedAndSortedResultRequestDto,
        CreateUpdateFaqDto>
    {
    }
}