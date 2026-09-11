using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Security
{
    // Kế thừa CreationAuditedEntity để ABP tự động lưu thời gian tạo (CreationTime) và người tạo (CreatorId)
    public class SecurityAlertLog : CreationAuditedEntity<Guid>
    {
        public Guid? TargetUserId { get; set; }
        public string TargetUserName { get; set; }
        public string AlertType { get; set; } // VD: "BruteForce", "UnauthorizedAccess", "DataLeak"
        public string ResourceName { get; set; }
        public string IpAddress { get; set; }
        public string Description { get; set; }

        protected SecurityAlertLog() { } // Cần thiết cho ORM

        public SecurityAlertLog(Guid id, Guid? targetUserId, string targetUserName, string alertType, string description, string resourceName = null, string ipAddress = null)
            : base(id)
        {
            TargetUserId = targetUserId;
            TargetUserName = targetUserName;
            AlertType = alertType;
            Description = description;
            ResourceName = resourceName;
            IpAddress = ipAddress;
        }
    }
}