using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Notifications
{
    public class AppNotificationDto : CreationAuditedEntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public string Title_Vi { get; set; }
        public string Title_En { get; set; }
        public string Message_Vi { get; set; }
        public string Message_En { get; set; }
        public string Type { get; set; }
        public bool IsRead { get; set; }
        public string? LinkUrl { get; set; }

        // Thuộc tính tương thích cho Frontend và Mapper cũ
        public string Title { get => Title_Vi; set => Title_Vi = value; }
        public string Message { get => Message_Vi; set => Message_Vi = value; }
    }
}