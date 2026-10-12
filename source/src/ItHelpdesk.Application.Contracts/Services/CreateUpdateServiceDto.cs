using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Services
{
    public class CreateUpdateServiceDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name_Vi { get; set; }

        [MaxLength(128)]
        public string Name_En { get; set; }

        [Required]
        public long CategoryId { get; set; }

        [MaxLength(1000)]
        public string? Description_Vi { get; set; }

        [MaxLength(1000)]
        public string? Description_En { get; set; }

        public bool IsActive { get; set; } = true;
    }
}