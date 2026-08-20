using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Notifications
{
    public class AppNotification : CreationAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; } // Người nhận thông báo
        public string Title { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public string LinkUrl { get; set; } // Link bấm vào để chuyển đến trang Ticket
    }
}