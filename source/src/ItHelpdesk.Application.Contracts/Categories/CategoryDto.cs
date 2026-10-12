using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Categories
{
    public class CategoryDto : FullAuditedEntityDto<long>
    {
        public string Code { get; set; }

        // Trường hiển thị động tự động chuyển đổi theo ngôn ngữ
        public string Name { get; set; }

        // Các trường phục vụ form Admin (2 Tab ngôn ngữ)
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public long? ParentId { get; set; }
        public bool IsActive { get; set; }
        public long? DefaultTeamId { get; set; }
    }
}