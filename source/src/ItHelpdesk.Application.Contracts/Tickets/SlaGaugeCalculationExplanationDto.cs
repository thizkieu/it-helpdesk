using System.Collections.Generic;

namespace ItHelpdesk.Tickets
{
    public class SlaGaugeCalculationExplanationDto
    {
        public double FinalScore { get; set; }
        public int TotalCompletedTickets { get; set; }
        public int OnTimeCount { get; set; }
        public int OverdueCount { get; set; }
        public double RawComplianceRate { get; set; }
        public string FormulaDescription { get; set; } = string.Empty;
        public List<string> BreakdownLogs { get; set; } = new List<string>();
    }
}