using ItHelpdesk.SignalR;
using ItHelpdesk.Security;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ItHelpdesk.Notifications
{
    [Authorize]
    public class NotificationAppService : ApplicationService, INotificationAppService
    {
        private readonly IRepository<AppNotification, Guid> _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IIdentityUserRepository _userRepository;
        private readonly IIdentityRoleRepository _roleRepository;
        private readonly IRepository<SecurityAlertLog, Guid> _securityAlertRepository;

        public NotificationAppService(
            IRepository<AppNotification, Guid> notificationRepository,
            IHubContext<NotificationHub> hubContext,
            IIdentityUserRepository userRepository,
            IIdentityRoleRepository roleRepository,
            IRepository<SecurityAlertLog, Guid> securityAlertRepository)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _securityAlertRepository = securityAlertRepository;
        }

        public async Task<List<AppNotificationDto>> GetMyNotificationsAsync()
        {
            try
            {
                var userId = CurrentUser.Id;
                if (userId == null) return new List<AppNotificationDto>();
                var notifications = await _notificationRepository.GetListAsync(x => x.UserId == userId.Value);
                if (notifications == null || !notifications.Any())
                    return new List<AppNotificationDto>();

                var sortedNotifications = notifications.OrderByDescending(x => x.CreationTime).ToList();

                return sortedNotifications.Select(x => new AppNotificationDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    Title_Vi = x.Title_Vi,
                    Title_En = x.Title_En,
                    Message_Vi = x.Message_Vi,
                    Message_En = x.Message_En,
                    Type = x.Type,
                    IsRead = x.IsRead,
                    LinkUrl = x.LinkUrl,
                    CreationTime = x.CreationTime
                }).ToList();
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Lỗi xảy ra trong GetMyNotificationsAsync: {Message}", ex.Message);
                throw new Volo.Abp.UserFriendlyException($"Lỗi hệ thống thông báo: {ex.Message}");
            }
        }

        public async Task MarkAsReadAsync(Guid id)
        {
            var notification = await _notificationRepository.GetAsync(id);
            if (CurrentUser.Id.HasValue && notification.UserId == CurrentUser.Id.Value)
            {
                notification.IsRead = true;
                await _notificationRepository.UpdateAsync(notification);
            }
        }

        public async Task MarkAllAsReadAsync()
        {
            var userId = CurrentUser.Id;
            if (userId == null) return;
            var unreadNotifications = await _notificationRepository.GetListAsync(x => x.UserId == userId.Value && !x.IsRead);
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }
            await _notificationRepository.UpdateManyAsync(unreadNotifications);
        }

        public async Task<int> GetUnreadCountAsync()
        {
            var userId = CurrentUser.Id;
            return userId == null ? 0 : await _notificationRepository.CountAsync(x => x.UserId == userId.Value && !x.IsRead);
        }

        public async Task SendBroadcastNotificationAsync(SendBroadcastDto input)
        {
            var users = await _userRepository.GetListAsync();
            var notifications = new List<AppNotification>();
            foreach (var user in users)
            {
                notifications.Add(new AppNotification(
                    GuidGenerator.Create(),
                    user.Id,
                    input.Title, input.Title,
                    input.Message, input.Message,
                    input.Type,
                    input.LinkUrl ?? string.Empty
                ));
            }
            await _notificationRepository.InsertManyAsync(notifications);
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                title_Vi = input.Title,
                title_En = input.Title,
                message_Vi = input.Message,
                message_En = input.Message,
                type = input.Type,
                linkUrl = input.LinkUrl ?? string.Empty,
                creationTime = Clock.Now
            });
        }

        private async Task SendToUserAsync(Guid targetUserId, string titleVi, string titleEn, string messageVi, string messageEn, string type, string? linkUrl = null)
        {
            var notification = new AppNotification(GuidGenerator.Create(), targetUserId, titleVi, titleEn, messageVi, messageEn, type, linkUrl ?? string.Empty);
            await _notificationRepository.InsertAsync(notification);
            await _hubContext.Clients.User(targetUserId.ToString()).SendAsync("ReceiveNotification", new
            {
                id = notification.Id,
                title_Vi = titleVi,
                title_En = titleEn,
                message_Vi = messageVi,
                message_En = messageEn,
                type = type,
                linkUrl = linkUrl ?? string.Empty,
                creationTime = notification.CreationTime
            });
        }

        private async Task SendToRoleAsync(string roleName, string titleVi, string titleEn, string messageVi, string messageEn, string type, string? linkUrl = null)
        {
            var role = await _roleRepository.FindByNormalizedNameAsync(roleName.ToUpper());
            if (role == null) return;
            var allUsers = await _userRepository.GetListAsync(includeDetails: true);
            var targetUsers = allUsers.Where(u => u.Roles != null && u.Roles.Any(r => r.RoleId == role.Id)).ToList();
            if (!targetUsers.Any()) return;

            var notifications = new List<AppNotification>();
            foreach (var user in targetUsers)
            {
                notifications.Add(new AppNotification(GuidGenerator.Create(), user.Id, titleVi, titleEn, messageVi, messageEn, type, linkUrl ?? string.Empty));
            }
            await _notificationRepository.InsertManyAsync(notifications);

            var targetConnectionIds = targetUsers.Select(u => u.Id.ToString()).ToList();
            await _hubContext.Clients.Users(targetConnectionIds).SendAsync("ReceiveNotification", new
            {
                title_Vi = titleVi,
                title_En = titleEn,
                message_Vi = messageVi,
                message_En = messageEn,
                type = type,
                linkUrl = linkUrl ?? string.Empty,
                creationTime = Clock.Now
            });
        }

        public async Task NotifyNewTicketCreatedAsync(string ticketNo, string creatorName, string serviceName)
        {
            var titleVi = "Yêu cầu mới được tạo";
            var titleEn = "New Ticket Created";
            var messageVi = $"Người dùng {creatorName} vừa tạo yêu cầu mới [{ticketNo}] cho dịch vụ {serviceName}.";
            var messageEn = $"User {creatorName} has created a new ticket [{ticketNo}] for service {serviceName}.";

            await SendToRoleAsync("Technician", titleVi, titleEn, messageVi, messageEn, "info", $"/tickets/it-queue?ticket={ticketNo}");
            await SendToRoleAsync("Admin", titleVi, titleEn, messageVi, messageEn, "info", $"/tickets/it-queue?ticket={ticketNo}");
        }

        public async Task NotifyTicketAssignedAsync(Guid assigneeId, string ticketNo)
        {
            var titleVi = "Bạn vừa được giao một yêu cầu mới";
            var titleEn = "A new ticket has been assigned to you";
            var messageVi = $"Yêu cầu [{ticketNo}] vừa được phân công cho bạn xử lý.";
            var messageEn = $"Ticket [{ticketNo}] has just been assigned to you for processing.";
            await SendToUserAsync(assigneeId, titleVi, titleEn, messageVi, messageEn, "warning", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyNewCommentAsync(Guid targetUserId, string ticketNo, string commenterName, bool isInternal)
        {
            var prefixVi = isInternal ? "[Nội bộ] " : "";
            var prefixEn = isInternal ? "[Internal] " : "";
            var titleVi = $"{prefixVi}Bình luận mới trên yêu cầu {ticketNo}";
            var titleEn = $"{prefixEn}New comment on ticket {ticketNo}";
            var messageVi = $"{commenterName} vừa thêm một bình luận mới.";
            var messageEn = $"{commenterName} has added a new comment.";
            await SendToUserAsync(targetUserId, titleVi, titleEn, messageVi, messageEn, "info", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyTicketResolvedAsync(Guid ticketCreatorId, string ticketNo, bool isClosed = false)
        {
            var titleVi = isClosed ? "Yêu cầu đã bị đóng/hủy" : "Yêu cầu đã được xử lý xong";
            var titleEn = isClosed ? "Ticket Closed/Canceled" : "Ticket Resolved";
            var msgVi = isClosed ? $"Yêu cầu [{ticketNo}] của bạn đã bị hủy." : $"Yêu cầu [{ticketNo}] của bạn đã được giải quyết hoàn tất.";
            var msgEn = isClosed ? $"Your ticket [{ticketNo}] has been canceled." : $"Your ticket [{ticketNo}] has been completely resolved.";
            var type = isClosed ? "error" : "success";
            await SendToUserAsync(ticketCreatorId, titleVi, titleEn, msgVi, msgEn, type, $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifySlaWarningAsync(Guid assigneeId, string ticketNo, int hoursLeft)
        {
            var titleVi = "Cảnh báo thời hạn xử lý (SLA)";
            var titleEn = "SLA Deadline Warning";
            var messageVi = $"Yêu cầu [{ticketNo}] chỉ còn {hoursLeft} giờ nữa là hết hạn SLA. Vui lòng xử lý gấp.";
            var messageEn = $"Ticket [{ticketNo}] has only {hoursLeft} hours left before SLA breach. Please process urgently.";
            await SendToUserAsync(assigneeId, titleVi, titleEn, messageVi, messageEn, "warning", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifySlaOverdueAsync(Guid assigneeId, string ticketNo)
        {
            var titleVi = "Vi phạm Cam kết SLA";
            var titleEn = "SLA Commitment Breach";
            var msgVi = $"CẢNH BÁO: Yêu cầu [{ticketNo}] đã quá hạn. Vui lòng giải quyết ngay!";
            var msgEn = $"WARNING: Ticket [{ticketNo}] is overdue. Please resolve immediately!";
            await SendToUserAsync(assigneeId, titleVi, titleEn, msgVi, msgEn, "error", $"/tickets/detail/{ticketNo}");

            var adminTitleVi = "Cảnh báo Đỏ SLA";
            var adminTitleEn = "SLA Red Alert";
            var adminMsgVi = $"[BÁO ĐỘNG] Yêu cầu [{ticketNo}] vừa vi phạm SLA và cần phân bổ lại nguồn lực ngay!";
            var adminMsgEn = $"[ESCALATION ALERT] Ticket [{ticketNo}] has just breached its SLA and needs resource reallocation!";
            await SendToRoleAsync("Admin", adminTitleVi, adminTitleEn, adminMsgVi, adminMsgEn, "error", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyAccountLockedAsync(Guid userId, string reason)
        {
            var titleVi = "Tài khoản bị khóa";
            var titleEn = "Account Locked";
            var msgVi = $"Tài khoản của bạn đã bị khóa tạm thời. Lý do: {reason}";
            var msgEn = $"Your account has been temporarily locked. Reason: {reason}";
            await SendToUserAsync(userId, titleVi, titleEn, msgVi, msgEn, "error");
        }

        public async Task NotifySuspiciousLoginAsync(Guid userId, string ipAddress)
        {
            var titleVi = "Cảnh báo Đăng nhập bất thường";
            var titleEn = "Suspicious Login Alert";
            var msgVi = $"Phát hiện lần đăng nhập từ địa chỉ IP lạ ({ipAddress}). Vui lòng kiểm tra lại.";
            var msgEn = $"Detected login from an unknown IP address ({ipAddress}). Please verify.";
            await SendToUserAsync(userId, titleVi, titleEn, msgVi, msgEn, "warning", "/profile/security");
        }

        public async Task NotifyUnauthorizedAccessAttemptAsync(Guid? violatorId, string userName, string resourceName, string? ipAddress = null)
        {
            var ip = string.IsNullOrWhiteSpace(ipAddress) ? "Unknown IP" : ipAddress;
            var msgVi = $"Phát hiện tài khoản {userName} (IP: {ip}) cố gắng truy cập trái phép vào {resourceName}.";
            var msgEn = $"Detected user {userName} (IP: {ip}) attempting unauthorized access to {resourceName}.";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), violatorId, userName, "UnauthorizedAccess", msgVi, resourceName, ipAddress ?? string.Empty));

            var titleVi = "Cảnh báo Bảo mật Cấp độ cao";
            var titleEn = "High-Level Security Alert";
            await SendToRoleAsync("Admin", titleVi, titleEn, msgVi, msgEn, "error", "/audit-logs");
        }

        public async Task DeleteAsync(Guid id)
        {
            var notification = await _notificationRepository.FirstOrDefaultAsync(x => x.Id == id);
            if (notification == null) return;
            if (CurrentUser.Id.HasValue && notification.UserId != CurrentUser.Id.Value)
            {
                throw new Volo.Abp.UserFriendlyException("Bạn không có quyền thao tác trên dữ liệu này.");
            }
            await _notificationRepository.DeleteAsync(notification);
        }

        [HttpDelete]
        [Route("api/app/notification/all-my-notifications")]
        public async Task DeleteAllMyNotificationsAsync()
        {
            var userId = CurrentUser.Id;
            if (userId == null) return;
            var notifications = await _notificationRepository.GetListAsync(x => x.UserId == userId.Value);
            if (notifications.Any())
            {
                await _notificationRepository.DeleteManyAsync(notifications);
            }
        }
    }
}