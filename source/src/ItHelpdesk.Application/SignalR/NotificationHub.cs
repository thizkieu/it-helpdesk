using Microsoft.AspNetCore.Authorization;
using Volo.Abp.AspNetCore.SignalR;

namespace ItHelpdesk.SignalR
{
    [Authorize]
    public class NotificationHub : AbpHub
    {
        // ABP tự động quản lý ConnectionId gắn với CurrentUser.Id ở dưới ngầm.
        // Bạn không cần viết thêm hàm gì ở đây, chỉ cần khai báo Hub.
    }
}