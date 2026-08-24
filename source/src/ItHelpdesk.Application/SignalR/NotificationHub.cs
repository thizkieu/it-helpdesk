using Microsoft.AspNetCore.Authorization;
using Volo.Abp.AspNetCore.SignalR;

namespace ItHelpdesk.SignalR
{
    [Authorize]
    public class NotificationHub : AbpHub
    {
        // ABP tự động quản lý ConnectionId gắn với CurrentUser.Id ở dưới ngầm.
    }
}