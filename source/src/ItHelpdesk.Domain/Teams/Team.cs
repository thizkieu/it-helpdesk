using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Teams
{
    public class Team : FullAuditedEntity<long>
    {
        public string Code { get; set; }

        // Tách thành song ngữ
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public Guid? ManagerId { get; set; }
        public bool IsActive { get; set; }
    }
}