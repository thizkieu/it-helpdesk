using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.KnowledgeBase
{
    public class FaqItem : FullAuditedEntity<long>
    {
        // Phân tách dữ liệu đa ngôn ngữ
        public string Question_Vi { get; set; }
        public string Question_En { get; set; }
        public string Answer_Vi { get; set; }
        public string Answer_En { get; set; }

        public string Category { get; set; }
        public string Icon { get; set; }
        public int DisplayOrder { get; set; }

        public FaqItem() { }

        public FaqItem(long id, string questionVi, string questionEn, string answerVi, string answerEn, string category, string icon = "fa-question", int displayOrder = 0) : base(id)
        {
            Question_Vi = questionVi;
            Question_En = questionEn;
            Answer_Vi = answerVi;
            Answer_En = answerEn;
            Category = category;
            Icon = icon;
            DisplayOrder = displayOrder;
        }
    }
}