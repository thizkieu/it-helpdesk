using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Priorities
{
    public class CreateUpdatePriorityDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        [MaxLength(128)]
        public string Name_Vi { get; set; }

        [MaxLength(128)]
        public string Name_En { get; set; }

        public int Level { get; set; }

        [MaxLength(50)]
        public string Color { get; set; }
        public bool IsActive { get; set; } = true;
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}