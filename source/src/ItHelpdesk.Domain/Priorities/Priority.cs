using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Priorities
{
    public class Priority : FullAuditedEntity<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public int Level { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; } = true;
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}