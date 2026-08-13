using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Services
{
    public class HelpdeskService : FullAuditedEntity<Guid>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public Guid CategoryId { get; set; } // Khóa ngoại trỏ về HelpdeskCategory
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}