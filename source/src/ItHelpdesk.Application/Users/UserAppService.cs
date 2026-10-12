using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using System.Linq.Dynamic.Core;
using Microsoft.AspNetCore.Authorization;
using ItHelpdesk.Permissions;
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Users
{
    [Authorize(ItHelpdeskPermissions.UserManagement.Default)]
    public class UserAppService : ItHelpdeskAppService, IUserAppService
    {
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IRepository<IdentityRole, Guid> _roleRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer;

        public UserAppService(
            IRepository<IdentityUser, Guid> userRepository,
            IRepository<IdentityRole, Guid> roleRepository,
            IStringLocalizer<ItHelpdeskResource> localizer)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _localizer = localizer;
        }

        public async Task<PagedResultDto<UserDto>> GetListAsync(GetUsersInput input)
        {
            try
            {
                var query = await _userRepository.GetQueryableAsync();

                // 1. Lọc theo từ khóa (Filter) - Hỗ trợ tìm theo UserName, Email, Name, Surname
                if (!string.IsNullOrWhiteSpace(input.Filter))
                {
                    var filter = input.Filter.Trim();
                    query = query.Where(x =>
                        (x.UserName != null && x.UserName.Contains(filter)) ||
                        (x.Email != null && x.Email.Contains(filter)) ||
                        (x.Name != null && x.Name.Contains(filter)) ||
                        (x.Surname != null && x.Surname.Contains(filter))
                    );
                }

                // 2. Lọc theo Vai trò (Role Name - VD: "TEAM_HD")
                if (!string.IsNullOrWhiteSpace(input.Role))
                {
                    // Lấy RoleId tương ứng với tên vai trò được truyền lên
                    var role = await _roleRepository.FirstOrDefaultAsync(r => r.Name == input.Role);
                    if (role != null)
                    {
                        // Truy vấn trực tiếp vào danh sách Roles được liên kết bên trong IdentityUser
                        query = query.Where(u => u.Roles.Any(r => r.RoleId == role.Id));
                    }
                    else
                    {
                        // Nếu role không tồn tại trong DB, trả về danh sách rỗng
                        query = query.Where(u => false);
                    }
                }

                // 3. Lọc theo trạng thái hoạt động (Active / Inactive)
                if (input.IsActive.HasValue)
                {
                    query = query.Where(x => x.IsActive == input.IsActive.Value);
                }

                var totalCount = await AsyncExecuter.CountAsync(query);

                var users = await AsyncExecuter.ToListAsync(
                    query.OrderBy(string.IsNullOrWhiteSpace(input.Sorting) ? "UserName asc" : input.Sorting)
                         .PageBy(input)
                );

                return new PagedResultDto<UserDto>(
                    totalCount,
                    ObjectMapper.Map<List<IdentityUser>, List<UserDto>>(users)
                );
            }
            catch (Exception ex)
            {
                // Log lỗi và hiển thị thông báo an toàn
                Console.WriteLine($"[UserAppService ERROR]: {ex.Message}");
                throw new UserFriendlyException(_localizer["Users:ErrorLoadUsers"]);
            }
        }
    }
}