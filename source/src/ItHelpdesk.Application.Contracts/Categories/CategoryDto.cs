using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Categories
{
    public class CategoryDto : FullAuditedEntityDto<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public long? ParentId { get; set; }
        public bool IsActive { get; set; }
        public long? DefaultTeamId { get; set; }
    }
}