using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Users
{
    public class UserDto : EntityDto<Guid>
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }

        // Cần List này để bảng Angular hiện được tên các Vai trò
        public List<string> RoleNames { get; set; } = new List<string>();
    }
}