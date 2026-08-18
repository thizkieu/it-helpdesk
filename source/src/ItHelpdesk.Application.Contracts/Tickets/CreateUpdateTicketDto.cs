using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class CreateUpdateTicketDto
    {
        [Required]
        [MaxLength(255)]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public long CategoryId { get; set; }

        [Required]
        public long PriorityId { get; set; }

        [Required]
        public long ServiceId { get; set; }
    }
}