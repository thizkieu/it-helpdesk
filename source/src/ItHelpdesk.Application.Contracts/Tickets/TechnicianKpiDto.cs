using System;

namespace ItHelpdesk.Tickets
{
    public class TechnicianKpiDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // 2 Thuộc tính dùng để hiển thị Đơn vị / Chức danh
        public string RoleName { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;

        public int TotalAssigned { get; set; }
        public int InProgressTickets { get; set; }
        public int ResolvedOnTime { get; set; }
        public int OverdueTickets { get; set; }
        public double OnTimeRate { get; set; }
        public double OverdueRate { get; set; }
        public decimal BaseSalary { get; set; }
        public decimal BonusAmount { get; set; }
        public decimal PenaltyAmount { get; set; }
        public decimal NetSalary { get; set; }
    }
}