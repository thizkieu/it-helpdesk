using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Priorities
{
    public class PriorityDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public int Level { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; }
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}