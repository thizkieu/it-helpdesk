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
        [MaxLength(128)]
        public string Name_Vi { get; set; }

        [MaxLength(128)]
        public string Name_En { get; set; }

        public Guid? ManagerId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}