using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Tickets
{
    public class TicketDto : FullAuditedEntityDto<long>
    {
        public string TicketNo { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
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

        // THUỘC TÍNH MỚI ĐỂ FRONTEND NHẬN DIỆN QUÁ HẠN
        public bool IsOverdue { get; set; }
    }
}