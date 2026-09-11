using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Notifications
{
    public class AppNotificationDto : CreationAuditedEntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; }
        public bool IsRead { get; set; }
        public string? LinkUrl { get; set; }
    }
}