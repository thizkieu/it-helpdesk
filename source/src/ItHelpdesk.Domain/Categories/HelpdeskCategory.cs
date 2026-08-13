using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Categories
{
    public class HelpdeskCategory : FullAuditedEntity<Guid>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public Guid? ParentId { get; set; }
        public bool IsActive { get; set; }
        public Guid? DefaultTeamId { get; set; }
    }
}