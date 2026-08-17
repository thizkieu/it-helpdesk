using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Priorities
{
    public class PriorityAppService : CrudAppService<Priority, PriorityDto, long, GetPriorityListInput, CreateUpdatePriorityDto>, IPriorityAppService
    {
        public PriorityAppService(IRepository<Priority, long> repository) : base(repository)
        {
            GetPolicyName = ItHelpdeskPermissions.Priorities.Default;
            GetListPolicyName = ItHelpdeskPermissions.Priorities.Default;
            CreatePolicyName = ItHelpdeskPermissions.Priorities.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Priorities.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Priorities.Delete;
        }

        protected override async Task<IQueryable<Priority>> CreateFilteredQueryAsync(GetPriorityListInput input)
        {
            var query = await base.CreateFilteredQueryAsync(input);
            if (!string.IsNullOrWhiteSpace(input.Filter))
            {
                query = query.Where(x => x.Name.Contains(input.Filter) || x.Code.Contains(input.Filter));
            }
            return query;
        }
    }
}