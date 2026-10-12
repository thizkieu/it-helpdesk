using System;
using System.ComponentModel.DataAnnotations.Schema;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Notifications
{
    [Table("AppNotifications")] 
    public class AppNotification : CreationAuditedAggregateRoot<Guid>
    {
        public Guid UserId { get; set; }

        public string Title_Vi { get; set; }
        public string Title_En { get; set; }

        public string Message_Vi { get; set; }
        public string Message_En { get; set; }

        public string Type { get; set; }
        public bool IsRead { get; set; }
        public string? LinkUrl { get; set; }

        public Guid? EntityId { get; set; }
        public string? EntityType { get; set; }

        [NotMapped]
        public string Title
        {
            get => Title_Vi;
            set => Title_Vi = value;
        }

        [NotMapped]
        public string Message
        {
            get => Message_Vi;
            set => Message_Vi = value;
        }

        protected AppNotification() { }

        public AppNotification(Guid id, Guid userId, string titleVi, string titleEn, string messageVi, string messageEn, string type, string? linkUrl = null)
            : base(id)
        {
            UserId = userId;
            Title_Vi = titleVi ?? "";
            Title_En = titleEn ?? "";
            Message_Vi = messageVi ?? "";
            Message_En = messageEn ?? "";
            Type = type ?? "info";
            LinkUrl = linkUrl;
            IsRead = false;
        }

        public static AppNotification CreateNew(Guid userId, string title, string message, string type = "success", string? linkUrl = null)
        {
            return new AppNotification(Guid.NewGuid(), userId, title, title, message, message, type, linkUrl);
        }
    }
}