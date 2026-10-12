using ItHelpdesk.Localization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp;
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
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer;

        public ExtendedUserAppService(
            IRepository<IdentityUser, Guid> userRepository,
            IIdentityRoleRepository roleRepository,
            IStringLocalizer<ItHelpdeskResource> localizer)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _localizer = localizer;
        }

        public async Task<PagedResultDto<ExtendedUserDto>> GetListAsync(GetExtendedUserListInput input)
        {
            try
            {
                // 1. Tải kèm danh sách Roles 
                var query = await _userRepository.WithDetailsAsync(x => x.Roles);

                // 2. Lọc theo từ khóa (Filter) 
                if (!string.IsNullOrWhiteSpace(input.Filter))
                {
                    var filter = input.Filter.Trim();
                    query = query.Where(u =>
                        (u.UserName != null && u.UserName.Contains(filter)) ||
                        (u.Email != null && u.Email.Contains(filter)) ||
                        (u.Name != null && u.Name.Contains(filter)) ||
                        (u.Surname != null && u.Surname.Contains(filter))
                    );
                }

                // 3. Lọc theo Vai trò (ĐÃ FIX: Lọc bằng Name thay vì RoleId)
                if (!string.IsNullOrWhiteSpace(input.Role))
                {
                    // Tìm RoleId tương ứng với cái Tên được truyền lên
                    var targetRole = await _roleRepository.FindByNormalizedNameAsync(input.Role.ToUpper());
                    if (targetRole != null)
                    {
                        query = query.Where(u => u.Roles.Any(r => r.RoleId == targetRole.Id));
                    }
                    else
                    {
                        // Trả về mảng rỗng nếu Role truyền lên không tồn tại
                        return new PagedResultDto<ExtendedUserDto>(0, new List<ExtendedUserDto>());
                    }
                }

                // 4. Lọc theo trạng thái Hoạt động (IsActive)
                if (input.IsActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == input.IsActive.Value);
                }

                // 5. Lấy dữ liệu phân trang
                var totalCount = await AsyncExecuter.CountAsync(query);
                var users = await AsyncExecuter.ToListAsync(
                    query.OrderByDescending(u => u.CreationTime)
                         .Skip(input.SkipCount)
                         .Take(input.MaxResultCount > 0 ? input.MaxResultCount : 10)
                );

                // 6. Query lấy danh sách Role một lần duy nhất vào bộ nhớ tạm
                var roles = await _roleRepository.GetListAsync();
                var roleDictionary = roles.ToDictionary(r => r.Id, r => r.Name);

                // 7 & 8. TỐI ƯU: Lặp một lần duy nhất để vừa Map vừa gán RoleName
                var mapper = new ItHelpdeskIdentityUserToExtendedUserDtoMapper();
                var userDtos = new List<ExtendedUserDto>();

                foreach (var userEntity in users)
                {
                    var userDto = mapper.Map(userEntity);

                    if (userEntity.Roles != null && userEntity.Roles.Any())
                    {
                        userDto.RoleNames = userEntity.Roles
                                            .Where(ur => roleDictionary.ContainsKey(ur.RoleId))
                                            .Select(ur => roleDictionary[ur.RoleId])
                                            .ToList();
                    }
                    else
                    {
                        userDto.RoleNames = new List<string>();
                    }

                    userDtos.Add(userDto);
                }

                return new PagedResultDto<ExtendedUserDto>(totalCount, userDtos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ExtendedUserAppService ERROR]: {ex.Message}");
                throw new UserFriendlyException(_localizer["Users:ErrorLoadUsers"]);
            }
        }
    }
}