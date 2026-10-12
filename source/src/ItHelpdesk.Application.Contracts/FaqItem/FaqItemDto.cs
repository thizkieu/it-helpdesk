using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.KnowledgeBase
{
    public class FaqItemDto : FullAuditedEntityDto<long>
    {
        // 2 Cột động này UI sẽ dùng để hiển thị (Backend tự động gán dữ liệu dựa trên ngôn ngữ)
        public string Question { get; set; }
        public string Answer { get; set; }

        // Các cột tĩnh này dùng để binding vào Form cho Admin chỉnh sửa (2 Tab ngôn ngữ)
        public string Question_Vi { get; set; }
        public string Question_En { get; set; }
        public string Answer_Vi { get; set; }
        public string Answer_En { get; set; }

        public string Category { get; set; }
        public int DisplayOrder { get; set; }
        public string Icon { get; set; }
    }
}