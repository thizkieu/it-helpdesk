using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Notifications
{
    public class AppNotification : CreationAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; } // Người nhận thông báo
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } // Phân loại: "info", "success", "warning", "error"
        public bool IsRead { get; set; }
        public string? LinkUrl { get; set; } // Link bấm vào để chuyển đến trang Ticket

        protected AppNotification() { }

        public AppNotification(Guid id, Guid userId, string title, string message, string type, string? linkUrl = null)
            : base(id)
        {
            UserId = userId;
            Title = title;
            Message = message;
            Type = type;
            LinkUrl = linkUrl;
            IsRead = false;
        }

        // Factory Method chuẩn chuyên nghiệp để khởi tạo thông báo an toàn
        public static AppNotification CreateNew(Guid userId, string title, string message, string type = "success", string? linkUrl = null)
        {
            return new AppNotification(Guid.NewGuid(), userId, title, message, type, linkUrl);
        }
    }
}