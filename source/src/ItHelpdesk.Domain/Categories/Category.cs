using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Categories
{
    public class Category : FullAuditedEntity<long>
    {
        public string Code { get; set; }

        // Tách thành song ngữ
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public long? ParentId { get; set; }
        public bool IsActive { get; set; }
        public long? DefaultTeamId { get; set; }
    }
}