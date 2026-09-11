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

            // 1. Đưa mọi user vào group cá nhân riêng biệt dựa theo UserId
            if (CurrentUser.Id.HasValue)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{CurrentUser.Id.Value}");
            }

            // 2. Phân loại nhóm người dùng dựa theo các Role thực tế trong hệ thống của bạn
            if (Context.User != null)
            {
                // Nhóm xử lý nghiệp vụ / tiếp nhận / kỹ thuật (Nhận thông báo khi có vé mới)
                if (Context.User.IsInRole("admin") ||
                    Context.User.IsInRole("IT_Manager") ||
                    Context.User.IsInRole("Helpdesk_Agent") ||
                    Context.User.IsInRole("IT_Technician"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_technicians");
                }

                // Nhóm người dùng cuối (End User)
                if (Context.User.IsInRole("End_User"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "group_endusers");
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (CurrentUser.Id.HasValue)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{CurrentUser.Id.Value}");
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_technicians");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "group_endusers");

            await base.OnDisconnectedAsync(exception);
        }
    }
}