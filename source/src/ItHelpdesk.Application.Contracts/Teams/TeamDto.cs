using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Teams
{
    public class TeamDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public Guid? ManagerId { get; set; }
        public bool IsActive { get; set; }
    }
}