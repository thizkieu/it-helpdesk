using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Services
{
    public class GetServiceListInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
    }
}