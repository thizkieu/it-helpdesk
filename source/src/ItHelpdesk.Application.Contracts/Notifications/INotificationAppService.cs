using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.Notifications
{
    public interface INotificationAppService : IApplicationService
    {
        Task<List<AppNotificationDto>> GetMyNotificationsAsync();
        Task MarkAsReadAsync(Guid id);
        Task MarkAllAsReadAsync();
        Task<int> GetUnreadCountAsync();
        Task SendBroadcastNotificationAsync(SendBroadcastDto input);
    }
}