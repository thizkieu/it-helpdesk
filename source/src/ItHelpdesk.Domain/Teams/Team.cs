using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Teams
{
    public class Team : FullAuditedEntity<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public Guid? ManagerId { get; set; }
        public bool IsActive { get; set; }
    }
}