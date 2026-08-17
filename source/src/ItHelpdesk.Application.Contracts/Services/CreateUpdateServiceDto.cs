using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Services
{
    public class CreateUpdateServiceDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        [Required]
        public long CategoryId { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}