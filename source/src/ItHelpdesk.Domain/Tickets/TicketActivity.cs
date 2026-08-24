using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class TicketActivity : CreationAuditedEntity<long> 
    {
        public long TicketId { get; set; }

        public string ActivityType { get; set; }
        public string Description { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }

        protected TicketActivity() { }

        public TicketActivity(long ticketId, string activityType, string description, string? oldValue = null, string? newValue = null)
        {
            TicketId = ticketId;
            ActivityType = activityType;
            Description = description;
            OldValue = oldValue;
            NewValue = newValue;
        }
    }
}