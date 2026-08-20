using System;

namespace ItHelpdesk.Tickets
{
    public class DashboardStatsDto
    {
        public long TotalTickets { get; set; }
        public long NewTickets { get; set; }
        public long UnassignedTickets { get; set; }
        public long ResolvedTickets { get; set; }
        public long OverdueTickets { get; set; }
        public double SlaComplianceRate { get; set; } // Tỷ lệ phần trăm đúng hạn SLA (%)
    }
}