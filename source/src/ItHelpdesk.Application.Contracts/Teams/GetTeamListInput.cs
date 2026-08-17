using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Teams
{
    public class GetTeamListInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
    }
}