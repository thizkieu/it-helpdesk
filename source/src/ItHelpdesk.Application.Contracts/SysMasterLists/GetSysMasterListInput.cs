namespace ItHelpdesk.SysMasterLists
{
    public class GetSysMasterListInput
    {
        public string? KeyWord { get; set; }
        public string? Status { get; set; }
        public string? MasterListGroupCde { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
    }
}
