using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class CreateTicketCommentDto
    {
        [Required]
        public long TicketId { get; set; }

        public long? ParentId { get; set; } // ID bình luận gốc được trỏ tới

        [Required]
        public string Content { get; set; }

        public bool IsInternal { get; set; }
    }
}