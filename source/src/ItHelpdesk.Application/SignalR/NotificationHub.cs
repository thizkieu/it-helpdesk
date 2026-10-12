using Microsoft.AspNetCore.Authorization;
using Volo.Abp.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace ItHelpdesk.SignalR
{
    [Authorize]
    public class NotificationHub : AbpHub
    {
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();

            // 1. Group cá nhân cho mọi user (ABP đã hỗ trợ Clients.User(id), nhưng nếu dùng Group thì đăng ký ở đây)
            if (CurrentUser.Id.HasValue)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{CurrentUser.Id.Value}");
            }

            // 2. Phân chia Group theo Role nghiệp vụ thực tế trên hệ thống
            if (Context.User != null)
            {
                // Nhóm Quản trị hệ thống tối cao
                if (Context.User.IsInRole("admin") || Context.User.IsInRole("Admin"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_admins");
                }

                // Nhóm Cấp quản lý IT (IT Manager / Trưởng phòng)
                if (Context.User.IsInRole("IT_Manager") || Context.User.IsInRole("Manager"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_managers");
                }

                // Nhóm Kỹ thuật viên xử lý vé (Helpdesk Agent / IT Technician)
                // Manager cũng có thể nằm trong nhóm này để theo dõi tiến độ
                if (Context.User.IsInRole("IT_Manager") ||
                    Context.User.IsInRole("Helpdesk_Agent") ||
                    Context.User.IsInRole("IT_Technician"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_technicians");
                }

                // Nhóm Người dùng cuối (End User)
                if (Context.User.IsInRole("End_User") || Context.User.IsInRole("user"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_endusers");
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Gỡ Group cá nhân
            if (CurrentUser.Id.HasValue)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{CurrentUser.Id.Value}");
            }

            // Gỡ khỏi toàn bộ các group nghiệp vụ khi mất kết nối
            // Cấu trúc try-catch nhỏ để đảm bảo nếu quá trình gỡ lỗi (do timeout kết nối) thì base.OnDisconnectedAsync vẫn được gọi
            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_admins");
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_managers");
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_technicians");
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_endusers");
            }
            catch (Exception ex)
            {
                // Ghi log nhẹ hoặc bỏ qua vì user đằng nào cũng đã disconnect
                Console.WriteLine($"Lỗi khi gỡ SignalR Group: {ex.Message}");
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}