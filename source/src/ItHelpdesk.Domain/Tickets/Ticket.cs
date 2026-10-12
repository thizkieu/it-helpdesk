using ItHelpdesk.Categories;
using ItHelpdesk.Priorities;
using ItHelpdesk.Services;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class Ticket : FullAuditedEntity<long>
    {
        public string TicketNo { get; set; } = string.Empty;

        // (Đã xóa 2 dòng Title và Description cũ ở đây để tránh trùng lặp)

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
            Title_Vi = title ?? string.Empty;
            Description_Vi = description ?? string.Empty;
            CategoryId = categoryId;
            PriorityId = priorityId;
            ServiceId = serviceId;
            Status = TicketStatus.New;
        }

        public virtual Category Category { get; set; }
        public virtual Service Service { get; set; }
        public virtual Priority Priority { get; set; }
        public long? ParentTicketId { get; set; }

        // Các trường đa ngôn ngữ mới
        public string Title_Vi { get; set; } = string.Empty;
        public string Title_En { get; set; } = string.Empty;
        public string Description_Vi { get; set; } = string.Empty;
        public string Description_En { get; set; } = string.Empty;

        // Tương thích ngược (Bọc [NotMapped] để giữ cho code cũ không báo lỗi)
        [NotMapped] public string Title { get => Title_Vi; set => Title_Vi = value; }
        [NotMapped] public string Description { get => Description_Vi; set => Description_Vi = value; }
    }
}