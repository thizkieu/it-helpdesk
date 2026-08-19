using System;
using Volo.Abp.Domain.Entities.Auditing;

namespace ItHelpdesk.Tickets
{
    public class TicketAttachment : CreationAuditedEntity<long>
    {
        public long TicketId { get; set; }

        public string FileName { get; set; } // Tên file gốc (VD: bao-cao.pdf)

        public string BlobName { get; set; } // Tên định danh duy nhất trên hệ thống lưu trữ

        public long Size { get; set; }       // Kích thước file (bytes)

        public string ContentType { get; set; } // Định dạng file (VD: application/pdf, image/png)

        protected TicketAttachment() { }

        public TicketAttachment(long ticketId, string fileName, string blobName, long size, string contentType)
        {
            TicketId = ticketId;
            FileName = fileName;
            BlobName = blobName;
            Size = size;
            ContentType = contentType;
        }
    }
}