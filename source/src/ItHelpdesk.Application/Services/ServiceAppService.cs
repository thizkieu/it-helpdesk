using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Services
{
    public class ServiceAppService : CrudAppService<
        Service,
        ServiceDto,
        long,
        GetServiceListInput,
        CreateUpdateServiceDto>, IServiceAppService
    {
        public ServiceAppService(IRepository<Service, long> repository) : base(repository)
        {
            // Phân quyền API
            GetPolicyName = ItHelpdeskPermissions.Services.Default;
            GetListPolicyName = ItHelpdeskPermissions.Services.Default;
            CreatePolicyName = ItHelpdeskPermissions.Services.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Services.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Services.Delete;
        }

        protected override async Task<IQueryable<Service>> CreateFilteredQueryAsync(GetServiceListInput input)
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