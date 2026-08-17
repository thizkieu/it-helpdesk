using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Teams
{
    public class TeamAppService : CrudAppService<Team, TeamDto, long, GetTeamListInput, CreateUpdateTeamDto>, ITeamAppService
    {
        public TeamAppService(IRepository<Team, long> repository) : base(repository)
        {
            GetPolicyName = ItHelpdeskPermissions.Teams.Default;
            GetListPolicyName = ItHelpdeskPermissions.Teams.Default;
            CreatePolicyName = ItHelpdeskPermissions.Teams.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Teams.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Teams.Delete;
        }

        protected override async Task<IQueryable<Team>> CreateFilteredQueryAsync(GetTeamListInput input)
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