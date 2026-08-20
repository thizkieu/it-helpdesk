using System;
using Volo.Abp.Domain.Entities.Auditing;
using ItHelpdesk.Tickets;

namespace ItHelpdesk.Tickets
{
    public class Ticket : FullAuditedEntity<long>
    {
        public string TicketNo { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        // Khóa ngoại liên kết danh mục
        public long CategoryId { get; set; }
        public long PriorityId { get; set; }

        // Bổ sung ServiceId dựa theo Form Angular vừa thiết kế
        public long ServiceId { get; set; }

        // Quản lý xử lý
        public TicketStatus Status { get; set; }
        public Guid? AssigneeId { get; set; }
        public long? TeamId { get; set; }

        // Giám sát SLA
        public DateTime? DueDate { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? TargetResponseTime { get; set; }
        public DateTime? TargetResolutionTime { get; set; }

        public Ticket()
        {
            // Constructor mặc định cho ORM
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
            Status = TicketStatus.New; // Mặc định khi tạo mới
        }
    }
}