using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Tickets
{
    public class GetTicketListDto : PagedAndSortedResultRequestDto
    {
        
        public string? Filter { get; set; }

        public int? Status { get; set; }
    }
}