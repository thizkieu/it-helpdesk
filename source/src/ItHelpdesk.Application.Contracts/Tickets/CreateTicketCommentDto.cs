using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class CreateTicketCommentDto
    {
        [Required]
        public long TicketId { get; set; }

        [Required]
        public string Content { get; set; }

        public bool IsInternal { get; set; }
    }
}