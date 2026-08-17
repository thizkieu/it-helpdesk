using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Categories
{
    public class CreateUpdateCategoryDto
    {
        [Required]
        [StringLength(50)]
        public string Code { get; set; }

        [Required]
        [StringLength(128)]
        public string Name { get; set; }

        public long? ParentId { get; set; }
        public bool IsActive { get; set; } = true;
        public long? DefaultTeamId { get; set; }
    }
}