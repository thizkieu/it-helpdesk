using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Services
{
    public class Service : FullAuditedEntity<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public long CategoryId { get; set; } 
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}