using System;

namespace ItHelpdesk.Model
{
    public class BasicModel
    {
        public bool? IsDeleted { get; set; }
        public string? TenantId { get; set; }
        public string? RowVersion { get; set; }
        public string CreateBy { get; set; }
        public DateTime CreateDate { get; set; }
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}
