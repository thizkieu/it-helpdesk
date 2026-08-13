using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Teams
{
    public class HelpdeskTeam : FullAuditedEntity<Guid>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public Guid? ManagerId { get; set; } // Trỏ về User làm trưởng nhóm
        public bool IsActive { get; set; }
    }
}