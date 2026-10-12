using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Services
{
    public class ServiceDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }
        public string Name { get; set; }

        // Thêm dấu ? để cho phép Null
        public string? Description { get; set; }

        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        // Thêm dấu ? để cho phép Null
        public string? Description_Vi { get; set; }
        public string? Description_En { get; set; }

        public long CategoryId { get; set; }
        public bool IsActive { get; set; }
    }
}