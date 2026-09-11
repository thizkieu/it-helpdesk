using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace ItHelpdesk.ExtendedUsers
{
    [Authorize(IdentityPermissions.Users.Default)]
    public class ExtendedUserAppService : ApplicationService, IExtendedUserAppService
    {
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IIdentityRoleRepository _roleRepository;

        public ExtendedUserAppService(
            IRepository<IdentityUser, Guid> userRepository,
            IIdentityRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        public async Task<PagedResultDto<ExtendedUserDto>> GetListAsync(GetExtendedUserListInput input)
        {
            // 1. Tải kèm danh sách Roles (Bắt buộc để tránh lỗi NullReferenceException)
            var query = await _userRepository.WithDetailsAsync(x => x.Roles);

            // 2. Lọc theo từ khóa (Filter)
            if (!string.IsNullOrWhiteSpace(input.Filter))
            {
                query = query.Where(u => u.UserName.Contains(input.Filter) ||
                                         u.Email.Contains(input.Filter) ||
                                         u.Name.Contains(input.Filter));
            }

            // 3. Lọc theo RoleId 
            if (input.RoleId.HasValue)
            {
                query = query.Where(u => u.Roles.Any(r => r.RoleId == input.RoleId.Value));
            }

            // 4. Lọc theo trạng thái Hoạt động (IsActive) từ Frontend gửi lên
            if (input.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == input.IsActive.Value);
            }

            // 5. Lấy dữ liệu phân trang
            var totalCount = await AsyncExecuter.CountAsync(query);
            var users = await AsyncExecuter.ToListAsync(
                query.OrderByDescending(u => u.CreationTime)
                     .Skip(input.SkipCount)
                     .Take(input.MaxResultCount)
            );

            // 6. Query lấy danh sách Role một lần duy nhất
            var roles = await _roleRepository.GetListAsync();

            // 7. [SỬA LỖI TẠI ĐÂY] Sử dụng Mapperly thay vì AutoMapper (ObjectMapper)
            var mapper = new ItHelpdeskIdentityUserToExtendedUserDtoMapper();
            var userDtos = users.Select(u => mapper.Map(u)).ToList();

            // 8. Gán RoleNames vào từng UserDto
            foreach (var userDto in userDtos)
            {
                var userEntity = users.First(u => u.Id == userDto.Id);

                // Kiểm tra an toàn trước khi lấy quyền
                if (userEntity.Roles != null && userEntity.Roles.Any())
                {
                    var userRoleIds = userEntity.Roles.Select(r => r.RoleId).ToList();
                    userDto.RoleNames = roles.Where(r => userRoleIds.Contains(r.Id)).Select(r => r.Name).ToList();
                }
                else
                {
                    userDto.RoleNames = new List<string>();
                }
            }

            return new PagedResultDto<ExtendedUserDto>(totalCount, userDtos);
        }
    }
}