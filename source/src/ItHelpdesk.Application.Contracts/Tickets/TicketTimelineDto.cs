using System;
using System.Collections.Generic;

namespace ItHelpdesk.Tickets
{
    public class TicketTimelineDto
    {
        public long? Id { get; set; } // ID của Comment hoặc Activity
        public long? ParentId { get; set; } // Trỏ đến ID của bình luận gốc (nếu có)
        public string Type { get; set; } // "Comment" hoặc "Activity"
        public string Content { get; set; } // Nội dung comment hoặc mô tả Activity
        public bool IsInternal { get; set; } // Phân biệt ghi chú nội bộ
        public DateTime CreationTime { get; set; }
        public Guid? CreatorId { get; set; }
        public string? CreatorName { get; set; }

        // Thêm trường CreatorAvatar để chứa ảnh đại diện cá nhân (ảnh blob hoặc chibi)
        public string? CreatorAvatar { get; set; }

        // Thêm danh sách chứa các bình luận trả lời (nested replies)
        public List<TicketTimelineDto> Replies { get; set; } = new();
    }
}