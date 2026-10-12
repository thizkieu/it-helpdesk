using System;
using System.ComponentModel.DataAnnotations.Schema;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class TicketActivity : CreationAuditedEntity<long>
    {
        public long TicketId { get; set; }

        public string ActivityType { get; set; }

        public string? OldValue { get; set; }
        public string? NewValue { get; set; }

        // Các trường đa ngôn ngữ mới
        public string Description_Vi { get; set; } = string.Empty;
        public string Description_En { get; set; } = string.Empty;

        // Tương thích ngược (Bọc [NotMapped] để giữ cho code cũ không báo lỗi)
        [NotMapped]
        public string Description { get => Description_Vi; set => Description_Vi = value; }

        protected TicketActivity() { }

        public TicketActivity(long ticketId, string activityType, string description, string? oldValue = null, string? newValue = null)
        {
            TicketId = ticketId;
            ActivityType = activityType;
            Description_Vi = description ?? string.Empty; // Gán vào cột Vi mặc định
            OldValue = oldValue;
            NewValue = newValue;
        }
    }
}