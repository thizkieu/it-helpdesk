using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Notifications
{
    public class SendBroadcastDto
    {
        [Required]
        [StringLength(255)]
        public string Title { get; set; }

        [Required]
        [StringLength(2000)]
        public string Message { get; set; }

        [Required]
        [StringLength(50)]
        public string Type { get; set; } // 'info', 'success', 'warning', 'error'

        // BỔ SUNG TRƯỜNG NÀY (Không bắt buộc - để Admin có thể chèn link hoặc không)
        [StringLength(500)]
        public string? LinkUrl { get; set; }
    }
}