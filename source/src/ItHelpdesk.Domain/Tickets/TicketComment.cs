using System;
using System.ComponentModel.DataAnnotations.Schema;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class TicketComment : CreationAuditedEntity<long>
    {
        public long TicketId { get; set; }
        public long? ParentId { get; set; } // Liên kết đến ID bình luận được trả lời (nếu có)
        public bool IsInternal { get; set; }

        // Các trường đa ngôn ngữ mới
        public string Content_Vi { get; set; } = string.Empty;
        public string Content_En { get; set; } = string.Empty;

        // Tương thích ngược (Bọc [NotMapped] để giữ cho code cũ không báo lỗi)
        [NotMapped]
        public string Content { get => Content_Vi; set => Content_Vi = value; }

        protected TicketComment() { }

        public TicketComment(long ticketId, string content, bool isInternal = false, long? parentId = null)
        {
            TicketId = ticketId;
            Content_Vi = content ?? string.Empty; // Gán vào cột Vi mặc định
            IsInternal = isInternal;
            ParentId = parentId;
        }
    }
}