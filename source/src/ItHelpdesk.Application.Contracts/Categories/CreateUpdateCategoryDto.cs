using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Categories
{
    public class CreateUpdateCategoryDto
    {
        [Required]
        [StringLength(50)]
        public string Code { get; set; }

        // Tách thành 2 trường nhập liệu riêng biệt cho form Admin
        [Required]
        [StringLength(128)]
        public string Name_Vi { get; set; }

        [StringLength(128)]
        public string Name_En { get; set; }

        public long? ParentId { get; set; }
        public bool IsActive { get; set; } = true;
        public long? DefaultTeamId { get; set; }
    }
}