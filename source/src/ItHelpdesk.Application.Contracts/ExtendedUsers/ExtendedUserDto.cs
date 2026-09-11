using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Identity;

namespace ItHelpdesk.ExtendedUsers
{
    // DTO kế thừa từ user mặc định và bổ sung thêm mảng quyền
    public class ExtendedUserDto : IdentityUserDto
    {
        public List<string> RoleNames { get; set; } = new List<string>();
    }

    // Input DTO để nhận tham số lọc từ Frontend
    public class GetExtendedUserListInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
        public Guid? RoleId { get; set; }

        //  Đón tham số lọc trạng thái hoạt động từ Angular
        public bool? IsActive { get; set; }
    }
}