using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Priorities
{
    public class PriorityDto : AuditedEntityDto<long>
    {
        public string Code { get; set; }

        // Trường hiển thị động theo ngôn ngữ trình duyệt
        public string Name { get; set; }

        // Phục vụ form Admin (2 Tab)
        public string Name_Vi { get; set; }
        public string Name_En { get; set; }

        public int Level { get; set; }
        public string Color { get; set; }
        public bool IsActive { get; set; }
        public int ResponseMinutes { get; set; }
        public int ResolutionMinutes { get; set; }
    }
}