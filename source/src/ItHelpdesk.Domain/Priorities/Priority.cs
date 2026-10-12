using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Priorities
{
    public class Priority : FullAuditedEntity<long>
    {
        public string Code { get; set; }

        // Tách thành song ngữ
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public int Level { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; } = true;
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}