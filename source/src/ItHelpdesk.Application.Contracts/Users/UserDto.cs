using System;
using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Users
{
    public class UserDto : EntityDto<Guid>
    {
        public string UserName { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public bool IsActive { get; set; }
    }
}