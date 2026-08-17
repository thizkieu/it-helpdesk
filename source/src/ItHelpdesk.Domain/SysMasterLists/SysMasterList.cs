using ItHelpdesk.Model;

namespace ItHelpdesk.SysMasterLists
{
    public class SysMasterList : BasicModel
    {
        public long ? MasterListID { get; set; }
        public string ? MasterListCode { get; set; }
        public string ? MasterListGroupCde { get; set; }
        public string? MasterListCdeName { get; set; }
        public string? MastListDefaultValue { get; set; }
        public string? MastListExtendValue1 { get; set; }
        public string? MastListExtendValue2 { get; set; }
        public string? MastListExtendValue3 { get; set; }
        public string? MastListExtendValue4 { get; set; }
        public string? MastListExtendValue5 { get; set; }
        public string? Description { get; set; }
        public int? OrderNo { get; set; }
        public string? MasterCde { get; set; }
        public bool? IsActive { get; set; }
    }
}
