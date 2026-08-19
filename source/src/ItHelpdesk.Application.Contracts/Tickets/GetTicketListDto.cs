using Volo.Abp.Application.Dtos;
using System;

namespace ItHelpdesk.Tickets
{
    public class GetTicketListDto : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
        public int? Status { get; set; }
        public Guid? AssigneeId { get; set; } // Lọc theo kỹ thuật viên
        public long? TeamId { get; set; }     // Lọc theo nhóm
        public bool? Unassigned { get; set; } // Lọc các ticket chưa phân công (true/false)
    }
}