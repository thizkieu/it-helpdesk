using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Categories
{
    public class Category : FullAuditedEntity<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public long? ParentId { get; set; }
        public bool IsActive { get; set; }
        public long? DefaultTeamId { get; set; }
    } 
}