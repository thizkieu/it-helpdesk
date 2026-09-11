using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ItHelpdesk.Hubs
{
    public class TicketHub : Hub
    {
        // Gửi thông báo đến toàn bộ Client đang kết nối
        public async Task SendTicketNotificationAsync(string message)
        {
            await Clients.All.SendAsync("ReceiveTicketNotification", message);
        }
    }
}