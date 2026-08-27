using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.KnowledgeBase
{
    public class FaqItemDto : FullAuditedEntityDto<long>
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Category { get; set; }
        public int DisplayOrder { get; set; }
        public string Icon { get; set; }
    }
}