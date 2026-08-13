using System;

namespace ItHelpdesk.SysMasterLists
{
    public class SysMasterListDto
    {
        public long MasterListID { get; set; }
        public string MasterListCode { get; set; }
        public string MasterListGroupCde { get; set; }
        public string? MasterListCdeName { get; set; }
        public string? MastListDefaultValue { get; set; }
        public string? MastListExtendValue1 { get; set; }
        public string? MastListExtendValue2 { get; set; }
        public string? MastListExtendValue3 { get; set; }
        public string? MastListExtendValue4 { get; set; }
        public string? MastListExtendValue5 { get; set; }
        public string? Description { get; set; }
        public int? OrderNo { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsDeleted { get; set; }
        public string? TenantId { get; set; }
        public string? RowVersion { get; set; }
        public string CreateBy { get; set; }
        public DateTime CreateDate { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int TotalRows { get; set; }
        public int TotalPages { get; set; }
        public int RowIndex { get; set; }
    }
}
