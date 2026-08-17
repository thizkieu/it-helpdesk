using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Priorities
{
    public class CreateUpdatePriorityDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        public int Level { get; set; }

        [MaxLength(50)]
        public string Color { get; set; }
        public bool IsActive { get; set; }
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}