using System.Collections.Generic;

namespace ItHelpdesk.Tickets
{
    public class DashboardStatsDto
    {
        public long TotalTickets { get; set; }
        public long NewTickets { get; set; }
        public long UnassignedTickets { get; set; }
        public long ResolvedTickets { get; set; }
        public long OverdueTickets { get; set; }
        public double SlaComplianceRate { get; set; }

        public List<string> SmartInsights { get; set; } = new List<string>();

        // Cần có dòng này để gọi ChartItemDto
        public List<ChartItemDto> StatusDistribution { get; set; } = new List<ChartItemDto>();
    }
}