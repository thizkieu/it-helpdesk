using Microsoft.AspNetCore.Authorization;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.KnowledgeBase
{
    [Authorize(ItHelpdeskPermissions.KnowledgeBase.Default)]
    public class FaqItemAppService : CrudAppService<
        FaqItem,
        FaqItemDto,
        long,
        PagedAndSortedResultRequestDto,
        CreateUpdateFaqDto>, IFaqItemAppService
    {
        public FaqItemAppService(IRepository<FaqItem, long> repository) : base(repository)
        {
            GetPolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            GetListPolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            CreatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default; // Hoặc thêm quyền riêng nếu có
            UpdatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            DeletePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
        }
    }
}