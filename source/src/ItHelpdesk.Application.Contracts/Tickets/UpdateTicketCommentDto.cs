using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class UpdateTicketCommentDto
    {
        [Required]
        [StringLength(2000)]
        public string Content { get; set; }

        public bool IsInternal { get; set; }
    }
}