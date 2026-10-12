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
        Task DeleteAsync(Guid id);
        Task DeleteAllMyNotificationsAsync();

        // CÁC HÀM NGHIỆP VỤ MỚI ĐÃ ĐƯỢC BỔ SUNG
        Task NotifyNewTicketCreatedAsync(string ticketNo, string creatorName, string serviceName);
        Task NotifyTicketAssignedAsync(Guid assigneeId, string ticketNo);
        Task NotifyNewCommentAsync(Guid targetUserId, string ticketNo, string commenterName, bool isInternal);
        Task NotifyTicketResolvedAsync(Guid ticketCreatorId, string ticketNo, bool isClosed = false);
        Task NotifySlaWarningAsync(Guid assigneeId, string ticketNo, int hoursLeft);
        Task NotifySlaOverdueAsync(Guid assigneeId, string ticketNo);
        Task NotifyAccountLockedAsync(Guid userId, string reason);
        Task NotifySuspiciousLoginAsync(Guid userId, string ipAddress);
        Task NotifyUnauthorizedAccessAttemptAsync(Guid? violatorId, string userName, string resourceName, string? ipAddress = null);
    }
}