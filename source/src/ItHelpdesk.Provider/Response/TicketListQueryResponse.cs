using System;

namespace ItHelpdesk.Provider.Response
{
    public class TicketListQueryResponse
    {
        // Khóa chính
        public long Id { get; set; }

        // Các thuộc tính của Ticket
        public string? TicketNo { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public long CategoryId { get; set; }
        public long PriorityId { get; set; }
        public long ServiceId { get; set; }

        // Dùng int để hứng dữ liệu từ SQL an toàn
        public int Status { get; set; }

        public Guid? AssigneeId { get; set; }
        public long? TeamId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public DateTime? TargetResponseTime { get; set; }
        public DateTime? TargetResolutionTime { get; set; }
        public bool IsOverdue { get; set; }

        // Các trường hệ thống ngầm
        public DateTime CreationTime { get; set; }
        public Guid? CreatorId { get; set; }
        public DateTime? LastModificationTime { get; set; }
        public Guid? LastModifierId { get; set; }
        public bool IsDeleted { get; set; }
        public Guid? DeleterId { get; set; }
        public DateTime? DeletionTime { get; set; }
    }

    // Model bổ sung cho phần Báo cáo (Report)
    public class TicketReportResponse
    {
        public int Status { get; set; }
        public int TotalCount { get; set; }
    }
}