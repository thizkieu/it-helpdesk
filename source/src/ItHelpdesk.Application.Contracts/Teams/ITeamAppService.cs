using Volo.Abp.Application.Services;

namespace ItHelpdesk.Teams
{
    public interface ITeamAppService : ICrudAppService<TeamDto, long, GetTeamListInput, CreateUpdateTeamDto>
    {
    }
}