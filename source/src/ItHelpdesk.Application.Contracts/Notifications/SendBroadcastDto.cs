using System;

namespace ItHelpdesk.Notifications
{
    public class SendBroadcastDto
    {
        public string Title { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } // 'info', 'success', 'warning', 'error'
    }
}