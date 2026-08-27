using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using System.Linq.Dynamic.Core;

namespace ItHelpdesk.Users
{
    public class UserAppService : ItHelpdeskAppService, IUserAppService
    {
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IRepository<IdentityRole, Guid> _roleRepository;

        public UserAppService(
            IRepository<IdentityUser, Guid> userRepository,
            IRepository<IdentityRole, Guid> roleRepository)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        public async Task<PagedResultDto<UserDto>> GetListAsync(GetUsersInput input)
        {
            var query = await _userRepository.GetQueryableAsync();

            // Thêm dấu ! vào sau input.Filter để xử lý cảnh báo vàng "Possible null reference"
            query = query.WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                x => x.UserName.Contains(input.Filter!) || x.Email.Contains(input.Filter!));

            // Lọc theo Vai trò (Role)
            if (!string.IsNullOrWhiteSpace(input.Role))
            {
                var role = await _roleRepository.FirstOrDefaultAsync(r => r.Name == input.Role);
                if (role != null)
                {
                    query = query.Where(u => u.Roles.Any(r => r.RoleId == role.Id));
                }
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
    }
}