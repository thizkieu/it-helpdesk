using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    // Kế thừa FullAuditedEntity để tự động lưu người tạo (CreatorId) và thời gian tạo (CreationTime)
    public class TicketComment : FullAuditedEntity<long>
    {
        public long TicketId { get; set; }
        public string Content { get; set; }

        // Phân loại comment: Nội bộ (Internal) chỉ IT thấy, hoặc Công khai (External) User cũng thấy
        public bool IsInternal { get; set; }

        public TicketComment()
        {
        }

        public TicketComment(long id, long ticketId, string content, bool isInternal = false)
            : base(id)
        {
            TicketId = ticketId;
            Content = content;
            IsInternal = isInternal;
        }
    }
}