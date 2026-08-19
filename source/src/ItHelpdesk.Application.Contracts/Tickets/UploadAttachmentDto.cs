using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Tickets
{
    public class UploadAttachmentDto
    {
        [Required]
        public long TicketId { get; set; }

        [Required]
        public string FileName { get; set; }

        [Required]
        public string Base64Content { get; set; }

        [Required]
        public string ContentType { get; set; }
    }
}