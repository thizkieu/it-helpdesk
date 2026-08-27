namespace ItHelpdesk.KnowledgeBase
{
    public class CreateUpdateFaqDto
    {
        public string Question { get; set; }
        public string Answer { get; set; }
        public string Category { get; set; }
        public int DisplayOrder { get; set; }
        public string Icon { get; set; }
    }
}