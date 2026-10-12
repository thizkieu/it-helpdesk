using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.KnowledgeBase
{
    public class CreateUpdateFaqDto
    {
        [Required]
        [StringLength(500)]
        public string Question_Vi { get; set; }

        [StringLength(500)]
        public string Question_En { get; set; }

        [Required]
        // Answer thường là nội dung HTML dài từ Rich Text Editor nên không cần giới hạn StringLength quá ngắn
        public string Answer_Vi { get; set; }

        public string Answer_En { get; set; }

        [Required]
        [StringLength(128)]
        public string Category { get; set; }

        public int DisplayOrder { get; set; }

        [StringLength(100)]
        public string Icon { get; set; }

        // Bổ sung cờ ẩn/hiện để dễ dàng quản lý FAQ lỗi thời
        public bool IsActive { get; set; } = true;
    }
}