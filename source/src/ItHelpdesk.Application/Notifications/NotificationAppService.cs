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

namespace ItHelpdesk.Notifications
{
    public class NotificationAppService : ApplicationService, INotificationAppService
    {
        private readonly IRepository<AppNotification, Guid> _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IIdentityUserRepository _userRepository;
        private readonly IRepository<SecurityAlertLog, Guid> _securityAlertRepository;

        public NotificationAppService(
            IRepository<AppNotification, Guid> notificationRepository,
            IHubContext<NotificationHub> hubContext,
            IIdentityUserRepository userRepository,
            IRepository<SecurityAlertLog, Guid> securityAlertRepository)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
            _userRepository = userRepository;
            _securityAlertRepository = securityAlertRepository;
        }

        // ==========================================
        // 1. CÁC HÀM GET & ĐÁNH DẤU ĐÃ ĐỌC
        // ==========================================

        public async Task<List<AppNotificationDto>> GetMyNotificationsAsync()
        {
            var userId = CurrentUser.Id;
            if (userId == null) return new List<AppNotificationDto>();

            var notifications = await _notificationRepository.GetListAsync(x => x.UserId == userId);
            var sortedNotifications = notifications.OrderByDescending(x => x.CreationTime).ToList();

            return ObjectMapper.Map<List<AppNotification>, List<AppNotificationDto>>(sortedNotifications);
        }

        public async Task MarkAsReadAsync(Guid id)
        {
            var notification = await _notificationRepository.GetAsync(id);
            if (notification.UserId == CurrentUser.Id)
            {
                notification.IsRead = true;
                await _notificationRepository.UpdateAsync(notification);
            }
        }

        public async Task MarkAllAsReadAsync()
        {
            var userId = CurrentUser.Id;
            if (userId == null) return;

            var unreadNotifications = await _notificationRepository.GetListAsync(x => x.UserId == userId && !x.IsRead);
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _notificationRepository.UpdateManyAsync(unreadNotifications);
        }

        public async Task<int> GetUnreadCountAsync()
        {
            var userId = CurrentUser.Id;
            if (userId == null) return 0;

            return await _notificationRepository.CountAsync(x => x.UserId == userId && !x.IsRead);
        }

        // ==========================================
        // 2. HÀM DÀNH CHO ADMIN (BROADCAST THỦ CÔNG)
        // ==========================================

        public async Task SendBroadcastNotificationAsync(SendBroadcastDto input)
        {
            var users = await _userRepository.GetListAsync();
            var notifications = new List<AppNotification>();

            foreach (var user in users)
            {
                notifications.Add(new AppNotification(
                    GuidGenerator.Create(),
                    user.Id,
                    input.Title,
                    input.Message,
                    input.Type,
                    null
                ));
            }

            await _notificationRepository.InsertManyAsync(notifications);

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                title = input.Title,
                message = input.Message,
                type = input.Type,
                creationTime = Clock.Now
            });
        }

        // ==========================================
        // 3. HÀM CỐT LÕI ĐỂ HỆ THỐNG GỬI TỰ ĐỘNG
        // ==========================================

        private async Task SendToUserAsync(Guid targetUserId, string title, string message, string type, string linkUrl = null)
        {
            var notification = new AppNotification(
                GuidGenerator.Create(),
                targetUserId,
                title,
                message,
                type,
                linkUrl
            );

            await _notificationRepository.InsertAsync(notification);

            await _hubContext.Clients.User(targetUserId.ToString()).SendAsync("ReceiveNotification", new
            {
                id = notification.Id,
                title = title,
                message = message,
                type = type,
                linkUrl = linkUrl,
                creationTime = notification.CreationTime
            });
        }

        // ==========================================
        // 4. CÁC HÀM TIỆN ÍCH (GỌI TỪ TICKET SERVICE)
        // ==========================================

        public async Task NotifyNewTicketCreatedAsync(Guid managerId, string ticketNo, string creatorName)
        {
            await SendToUserAsync(managerId, "Yêu cầu hỗ trợ mới", $"{creatorName} vừa tạo yêu cầu mới: {ticketNo}", "info", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyTicketAssignedAsync(Guid assigneeId, string ticketNo)
        {
            await SendToUserAsync(assigneeId, "Bạn được giao việc mới", $"Yêu cầu {ticketNo} vừa được chỉ định cho bạn xử lý.", "warning", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyNewCommentAsync(Guid targetUserId, string ticketNo, string commenterName)
        {
            await SendToUserAsync(targetUserId, "Có phản hồi mới", $"{commenterName} vừa bình luận trong yêu cầu {ticketNo}.", "info", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifyTicketResolvedAsync(Guid ticketCreatorId, string ticketNo, bool isClosed = false)
        {
            var title = isClosed ? "Yêu cầu đã Đóng" : "Yêu cầu đã Xử lý xong";
            var msg = isClosed ? $"Yêu cầu {ticketNo} đã bị đóng/hủy bỏ." : $"Yêu cầu {ticketNo} của bạn đã được giải quyết.";
            var type = isClosed ? "error" : "success";

            await SendToUserAsync(ticketCreatorId, title, msg, type, $"/tickets/detail/{ticketNo}");
        }

        // ==========================================
        // 5. SLA & HÀNG ĐỢI YÊU CẦU
        // ==========================================

        public async Task NotifySlaWarningAsync(Guid assigneeId, string ticketNo, int hoursLeft)
        {
            await SendToUserAsync(assigneeId, "Cảnh báo SLA", $"Yêu cầu {ticketNo} chỉ còn {hoursLeft} giờ để xử lý!", "warning", $"/tickets/detail/{ticketNo}");
        }

        public async Task NotifySlaOverdueAsync(Guid managerId, Guid assigneeId, string ticketNo)
        {
            var msg = $"Yêu cầu {ticketNo} đã VI PHẠM thời gian xử lý (SLA Overdue).";
            await SendToUserAsync(assigneeId, "Vi phạm SLA", msg, "error", $"/tickets/detail/{ticketNo}");
            await SendToUserAsync(managerId, "Báo cáo Vi phạm SLA", msg, "error", $"/tickets/detail/{ticketNo}");
        }

        // ==========================================
        // 6. CẨM NANG HƯỚNG DẪN (KNOWLEDGE BASE)
        // ==========================================

        public async Task NotifyKbArticlePublishedAsync(string articleTitle, string category)
        {
            var input = new SendBroadcastDto
            {
                Title = "Cẩm nang mới",
                Message = $"Quy trình mới: '{articleTitle}' vừa được cập nhật trong danh mục {category}.",
                Type = "info"
            };
            await SendBroadcastNotificationAsync(input);
        }

        // ==========================================
        // 7. QUẢN LÝ NGƯỜI DÙNG & TÀI KHOẢN
        // ==========================================

        public async Task NotifyAccountLockedAsync(Guid userId, string reason)
        {
            await SendToUserAsync(userId, "Tài khoản bị khóa", $"Tài khoản của bạn đã bị khóa. Lý do: {reason}", "error");
        }

        public async Task NotifyRoleChangedAsync(Guid userId, string newRole)
        {
            await SendToUserAsync(userId, "Cập nhật Phân quyền", $"Bạn vừa được cấp quyền truy cập: {newRole}.", "success");
        }

        public async Task NotifyProfileUpdatedAsync(Guid userId, bool isPassword = false)
        {
            var action = isPassword ? "Mật khẩu" : "Hồ sơ cá nhân";
            await SendToUserAsync(userId, "Bảo mật tài khoản", $"{action} của bạn vừa được cập nhật thành công.", "success", "/profile");
        }

        public async Task NotifySuspiciousLoginAsync(Guid userId, string ipAddress)
        {
            await SendToUserAsync(userId, "Cảnh báo Bảo mật", $"Phát hiện đăng nhập từ IP lạ: {ipAddress}. Hãy đổi mật khẩu nếu không phải bạn.", "warning");
        }

        // ==========================================
        // 8. BÁO CÁO & THỐNG KÊ (DASHBOARD)
        // ==========================================

        public async Task NotifySystemReportReadyAsync(Guid adminId, string month)
        {
            await SendToUserAsync(adminId, "Báo cáo định kỳ", $"Báo cáo hiệu suất Helpdesk tháng {month} đã sẵn sàng.", "info", "/dashboard");
        }

        // ==========================================
        // 9. QUẢN LÝ NHÓM KỸ THUẬT (TEAMS)
        // ==========================================

        public async Task NotifyTeamCreatedAsync(Guid managerId, string teamName)
        {
            await SendToUserAsync(managerId, "Tạo nhóm mới", $"Nhóm hỗ trợ '{teamName}' đã được khởi tạo thành công.", "success", "/teams");
        }

        public async Task NotifyMemberAddedToTeamAsync(Guid memberId, string teamName, string assignerName)
        {
            await SendToUserAsync(memberId, "Thêm vào nhóm", $"{assignerName} đã thêm bạn vào nhóm hỗ trợ '{teamName}'.", "info", "/teams");
        }

        public async Task NotifyMemberRemovedFromTeamAsync(Guid memberId, string teamName, string removerName)
        {
            await SendToUserAsync(memberId, "Rời khỏi nhóm", $"{removerName} đã gỡ bạn khỏi luồng xử lý của nhóm '{teamName}'.", "warning");
        }

        // ==========================================
        // 10. QUẢN LÝ DANH MỤC & DỊCH VỤ
        // ==========================================

        public async Task NotifyCategoryChangedAsync(Guid adminId, string action, string categoryName)
        {
            var type = action == "xóa" ? "error" : "success";
            await SendToUserAsync(adminId, "Cập nhật Danh mục", $"Hệ thống vừa {action} danh mục: {categoryName}.", type, "/categories");
        }

        public async Task NotifyServiceChangedAsync(Guid adminId, string action, string serviceName)
        {
            var type = action == "xóa" ? "error" : "success";
            await SendToUserAsync(adminId, "Cập nhật Dịch vụ", $"Hệ thống vừa {action} dịch vụ: {serviceName}.", type, "/services");
        }

        public async Task NotifyCategoryMappingAlertAsync(Guid adminId, string deletedCategory, int affectedTickets)
        {
            await SendToUserAsync(adminId, "Cảnh báo Ràng buộc dữ liệu", $"Danh mục '{deletedCategory}' đang có {affectedTickets} yêu cầu liên kết. Vui lòng chuyển hướng dữ liệu (Re-mapping) trước khi xóa.", "error", "/categories");
        }

        // ==========================================
        // 11. QUẢN LÝ ĐỘ ƯU TIÊN & SLA
        // ==========================================

        public async Task NotifyPriorityChangedAsync(Guid adminId, string action, string priorityName)
        {
            var type = action == "xóa" ? "error" : "success";
            await SendToUserAsync(adminId, "Cập nhật Độ ưu tiên", $"Hệ thống vừa {action} mức ưu tiên: {priorityName}.", type, "/priorities");
        }

        public async Task NotifyPrioritySlaChangedAsync(Guid teamManagerId, string priorityName, int newResponseMinutes, int newResolutionMinutes)
        {
            var msg = $"Mức ưu tiên '{priorityName}' vừa được cập nhật quy định SLA: Phản hồi {newResponseMinutes} phút, Xử lý {newResolutionMinutes} phút.";
            await SendToUserAsync(teamManagerId, "Thay đổi cam kết SLA", msg, "warning", "/priorities");
        }

        // ==========================================
        // 12. CẢNH BÁO BẢO MẬT & HÀNH VI KHẢ NGHI (CÓ LƯU AUDIT LOG)
        // ==========================================

        public async Task NotifyFailedLoginAttemptsAsync(Guid? violatorId, string email, int attemptCount, string ipAddress = null)
        {
            var msg = $"Phát hiện {attemptCount} lần đăng nhập thất bại liên tiếp từ tài khoản {email}.";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), violatorId, email, "BruteForce", msg, "Authentication", ipAddress));

            if (violatorId.HasValue)
            {
                await SendToUserAsync(violatorId.Value, "Cảnh báo Brute-force", msg + " Hệ thống có thể sẽ tạm khóa tính năng đăng nhập.", "error", "/profile/security");
            }
        }

        public async Task NotifyUnrecognizedDeviceLoginAsync(Guid userId, string deviceName, string ipAddress)
        {
            var msg = $"Tài khoản của bạn vừa được đăng nhập từ một thiết bị mới (IP: {ipAddress} - Thiết bị: {deviceName}).";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), userId, null, "UnrecognizedDevice", msg, "Authentication", ipAddress));

            await SendToUserAsync(userId, "Đăng nhập bất thường", msg + " Hãy đổi mật khẩu nếu không phải bạn.", "warning", "/profile/security");
        }

        public async Task NotifyUnauthorizedAccessAttemptAsync(Guid adminId, Guid? violatorId, string userName, string resourceName, string ipAddress = null)
        {
            var msg = $"Tài khoản '{userName}' đang cố gắng truy cập trái phép vào tài nguyên '{resourceName}' (Lỗi 403 Forbidden).";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), violatorId, userName, "UnauthorizedAccess", msg, resourceName, ipAddress));

            await SendToUserAsync(adminId, "Truy cập trái phép", msg, "error", "/audit-logs");
        }

        public async Task NotifyMassDataExportAsync(Guid adminId, Guid userId, string userName, string moduleName, int recordCount, string ipAddress = null)
        {
            var msg = $"Phát hiện hành vi trích xuất dữ liệu bất thường: Tài khoản '{userName}' vừa tải xuống {recordCount} bản ghi từ phân hệ {moduleName}.";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), userId, userName, "DataLeakAlert", msg, moduleName, ipAddress));

            await SendToUserAsync(adminId, "Cảnh báo Rò rỉ Dữ liệu", msg, "warning", "/audit-logs");
        }

        public async Task NotifyPrivilegeEscalationAttemptAsync(Guid adminId, Guid userId, string userName, string action, string ipAddress = null)
        {
            var msg = $"Phát hiện nỗ lực leo thang đặc quyền: Người dùng '{userName}' cố gắng thực thi API cấp cao '{action}' nhưng bị chặn lại.";

            await _securityAlertRepository.InsertAsync(new SecurityAlertLog(
                GuidGenerator.Create(), userId, userName, "PrivilegeEscalation", msg, action, ipAddress));

            await SendToUserAsync(adminId, "Cảnh báo Leo thang Đặc quyền", msg, "error", "/audit-logs");
        }
    }
}