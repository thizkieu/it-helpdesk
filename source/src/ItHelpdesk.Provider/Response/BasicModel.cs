namespace ItHelpdesk.Model
{
    public interface BasicModel
    {
        public bool? IsDeleted { get; set; }
        public string? TenantId { get; set; }
        public string? RowVersion { get; set; }
        public string CreateBy { get; set; }
        public DateTime CreateDate { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }

    public interface PageBasicModel
    {
        public int TotalRows { get; set; }
        public int TotalPages { get; set; }
        public int RowIndex { get; set; }
    }

    public interface PageCustomModel : BasicModel
    {
        public int TotalRows { get; set; }
        public int TotalPages { get; set; }
        public int RowIndex { get; set; }
    }
}
