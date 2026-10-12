using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Teams
{
    public class TeamDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }

        // Trường hiển thị động theo ngôn ngữ trình duyệt
        public string Name { get; set; }

        // Phục vụ form Admin (2 Tab)
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public Guid? ManagerId { get; set; }
        public bool IsActive { get; set; }

        // --- Các trường thống kê cho giao diện ---
        public int MemberCount { get; set; }
        public string LeadName { get; set; }

        // Đã bổ sung trường OpenTickets
        public int OpenTickets { get; set; }
    }
}