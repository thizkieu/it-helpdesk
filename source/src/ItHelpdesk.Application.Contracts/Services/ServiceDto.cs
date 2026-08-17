using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Services
{
    public class ServiceDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public long CategoryId { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }
}