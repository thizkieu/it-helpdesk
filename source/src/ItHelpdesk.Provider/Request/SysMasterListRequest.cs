namespace ItHelpdesk.Provider
{
    public class SysMasterListRequest
    {
        public string? KeyWord { get; set; }
        public string? Status { get; set; }
        public string? MasterListGroupCde { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public string? TenantId { get; set; }
    }

    public class SysMasterListInfoRequest
    {
        public long MasterListID { get; set; }
        public string? TenantId { get; set; }
    }

    public class SysMasterListAllCdeRequest
    {
        public string? MasterListGroupCde { get; set; }
        public string? TenantId { get; set; }
    }

    public class SysMasterListByCdeRequest
    {
        public string? MasterListGroupCde { get; set; }
        public string? MasterListCode { get; set; }
        public string? TenantId { get; set; }
    }
    
    public class SysMasterListInsertOrUpdateRequest
    {
        public long MasterListID { get; set; }
        public string? MasterListCode { get; set; }
        public string? MasterListGroupCde { get; set; }
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
        public string? RowVersion { get; set; }
        public string? CreateBy { get; set; }
        public string? ModifiedBy { get; set; }
        public string? TenantId { get; set; }
    }

    public class SysMasterListDeleteRequest
    {
        public long MasterListID { get; set; }
        public string? RowVersion { get; set; }
        public string? ModifiedBy { get; set; }
        public string? TenantId { get; set; }
    }
}
