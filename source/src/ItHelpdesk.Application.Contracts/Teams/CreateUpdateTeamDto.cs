using System;
using System.ComponentModel.DataAnnotations;

namespace ItHelpdesk.Teams
{
    public class CreateUpdateTeamDto
    {
        [Required]
        [MaxLength(50)]
        public string Code { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; }

        public Guid? ManagerId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}