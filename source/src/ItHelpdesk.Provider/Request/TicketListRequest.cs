using System;

namespace ItHelpdesk.Provider.Request
{
    public class TicketListRequest
    {
        public string? FilterText { get; set; }
        public int? Status { get; set; }
        public long? CategoryId { get; set; }
        public long? PriorityId { get; set; }
        public Guid? AssigneeId { get; set; }
        public long? TeamId { get; set; }
        public bool? Unassigned { get; set; }
        public Guid? CreatorId { get; set; }
        public int PageIndex { get; set; } = 0;
        public int PageSize { get; set; } = 10;
        public string? TenantId { get; set; }
    }

    public class TicketInfoRequest
    {
        public long Id { get; set; }
    }

    public class TicketInsertOrUpdateRequest
    {
        // Thêm constructor không tham số để Mapperly có thể khởi tạo đối tượng khi map
        public TicketInsertOrUpdateRequest() { }

        public long? Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public long CategoryId { get; set; }
        public long PriorityId { get; set; }
        public long ServiceId { get; set; }
        public int Status { get; set; }
        public Guid? AssigneeId { get; set; }
        public long? TeamId { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class TicketDeleteRequest
    {
        public long Id { get; set; }
    }

    public class TicketReportRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}