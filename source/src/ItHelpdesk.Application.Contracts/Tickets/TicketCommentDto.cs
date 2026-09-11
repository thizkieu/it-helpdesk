using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Tickets
{
    public class TicketCommentDto : AuditedEntityDto<long>
    {
        public long TicketId { get; set; }
        public long? ParentId { get; set; }
        public string Content { get; set; }
        public bool IsInternal { get; set; }

        // Các chi tiết quan trọng
        public string CreatorName { get; set; }
        public string UserAvatar { get; set; }   // Ảnh đại diện của tài khoản
        public string UserRole { get; set; }     // Vai trò (IT Support, Admin, Khách hàng...)

        // Danh sách các phản hồi con bên trong (nếu muốn làm dạng cây hội thoại)
        public List<TicketCommentDto> Replies { get; set; } = new();
    }
}