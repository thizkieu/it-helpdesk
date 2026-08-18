using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Tickets
{
    // Kế thừa AuditedEntityDto để có sẵn trường CreationTime và CreatorId (thời gian & người tạo)
    public class TicketCommentDto : AuditedEntityDto<long>
    {
        public long TicketId { get; set; }
        public string Content { get; set; }
        public bool IsInternal { get; set; }
    }
}