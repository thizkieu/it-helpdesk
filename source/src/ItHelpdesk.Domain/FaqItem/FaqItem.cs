using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.KnowledgeBase
{
    public class FaqItem : FullAuditedEntity<long>
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Category { get; set; }
        public string Icon { get; set; }
        public int DisplayOrder { get; set; }

        public FaqItem() { }

        public FaqItem(long id, string question, string answer, string category, string icon = "fa-question", int displayOrder = 0) : base(id)
        {
            Question = question;
            Answer = answer;
            Category = category;
            Icon = icon;
            DisplayOrder = displayOrder;
        }
    }
}