using System;

namespace ItHelpdesk.Tickets
{
    public class TicketTimelineDto
    {
        public string Type { get; set; } // "Comment" hoặc "Activity"
        public string Content { get; set; } // Nội dung comment hoặc mô tả Activity
        public bool IsInternal { get; set; } // Phân biệt ghi chú nội bộ
        public DateTime CreationTime { get; set; }
        public Guid? CreatorId { get; set; }
        public string? CreatorName { get; set; } // Thêm trường này để hiển thị tên trên Angular
    }
}