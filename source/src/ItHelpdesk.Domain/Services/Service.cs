using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Services
{
    public class Service : FullAuditedEntity<long>
    {
        public string Code { get; set; }
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }
        public long CategoryId { get; set; }
        public string? Description_Vi { get; set; }
        public string? Description_En { get; set; }
        public bool IsActive { get; set; }
    }
}