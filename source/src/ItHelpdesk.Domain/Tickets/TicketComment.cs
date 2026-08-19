using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class TicketComment : CreationAuditedEntity<long> // Đã đổi sang long
    {
        public long TicketId { get; set; }
        public string Content { get; set; }
        public bool IsInternal { get; set; }

        protected TicketComment() { }

        // Bỏ Guid id
        public TicketComment(long ticketId, string content, bool isInternal = false)
        {
            TicketId = ticketId;
            Content = content;
            IsInternal = isInternal;
        }
    }
}