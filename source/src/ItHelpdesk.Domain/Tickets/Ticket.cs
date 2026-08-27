using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class Ticket : FullAuditedEntity<long>
    {
        public string TicketNo { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public long CategoryId { get; set; }
        public long PriorityId { get; set; }
        public long ServiceId { get; set; }

        public TicketStatus Status { get; set; }
        public Guid? AssigneeId { get; set; }
        public long? TeamId { get; set; }

        public DateTime? DueDate { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? TargetResponseTime { get; set; }
        public DateTime? TargetResolutionTime { get; set; }

        public bool IsOverdue { get; set; } = false;

        public Ticket()
        {
        }

        public Ticket(long id, string ticketNo, string title, string description, long categoryId, long priorityId, long serviceId)
            : base(id)
        {
            TicketNo = ticketNo;
            Title = title;
            Description = description;
            CategoryId = categoryId;
            PriorityId = priorityId;
            ServiceId = serviceId;
            Status = TicketStatus.New;
        }
    }
}