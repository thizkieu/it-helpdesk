using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Priorities
{
    public class GetPriorityListInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
        public bool? IsActive { get; set; }
    }
}