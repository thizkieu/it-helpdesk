using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class AssignTicketDto
    {
        [Required]
        public long TicketId { get; set; }

        public Guid? AssigneeId { get; set; } // Kỹ thuật viên xử lý

        public long? TeamId { get; set; }     // Nhóm phụ trách
    }
}