using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Permissions;
using ItHelpdesk.Tickets;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Volo.Abp.Identity;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Teams
{
    public class TeamAppService : CrudAppService<
        Team,
        TeamDto,
        long,
        GetTeamListInput,
        CreateUpdateTeamDto,
        CreateUpdateTeamDto>,
        ITeamAppService
    {
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer;
        private readonly IIdentityUserRepository _identityUserRepository;
        private readonly IRepository<IdentityRole, Guid> _roleRepository;

        public TeamAppService(
            IRepository<Team, long> repository,
            IRepository<Ticket, long> ticketRepository,
            IStringLocalizer<ItHelpdeskResource> localizer,
            IIdentityUserRepository identityUserRepository,
            IRepository<IdentityRole, Guid> roleRepository) : base(repository)
        {
            _ticketRepository = ticketRepository;
            _localizer = localizer;
            _identityUserRepository = identityUserRepository;
            _roleRepository = roleRepository;

            CreatePolicyName = ItHelpdeskPermissions.Teams.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Teams.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Teams.Delete;
        }

        protected override async Task<IQueryable<Team>> CreateFilteredQueryAsync(GetTeamListInput input)
        {
            var query = await base.CreateFilteredQueryAsync(input);
            if (!string.IsNullOrWhiteSpace(input.Filter))
            {
                var filter = input.Filter.Trim();
                query = query.Where(x =>
                    (x.Code != null && x.Code.Contains(filter)) ||
                    (x.Name_Vi != null && x.Name_Vi.Contains(filter)) ||
                    (x.Name_En != null && x.Name_En.Contains(filter))
                );
            }
            return query;
        }

        public override async Task<PagedResultDto<TeamDto>> GetListAsync(GetTeamListInput input)
        {
            var pagedResult = await base.GetListAsync(input);

            // Lấy danh sách toàn bộ role hệ thống
            var roles = await _roleRepository.GetListAsync();

            // Chuẩn bị Queryable của bảng Ticket để đếm số lượng vé
            var ticketQuery = await _ticketRepository.GetQueryableAsync();

            foreach (var dto in pagedResult.Items)
            {
                ApplyTranslation(dto);

                // 1. Trưởng nhóm (LeadName)
                if (dto.ManagerId.HasValue && dto.ManagerId.Value != Guid.Empty)
                {
                    try
                    {
                        var managerUser = await _identityUserRepository.GetAsync(dto.ManagerId.Value);
                        dto.LeadName = managerUser != null ? $"{managerUser.Surname} {managerUser.Name}".Trim() : null;
                    }
                    catch
                    {
                        dto.LeadName = null;
                    }
                }

                // 2. Thống kê nhân sự (MemberCount)
                if (!string.IsNullOrWhiteSpace(dto.Code))
                {
                    var matchedRole = roles.FirstOrDefault(r => r.Name.Equals(dto.Code, StringComparison.OrdinalIgnoreCase));
                    if (matchedRole != null)
                    {
                        var members = await _identityUserRepository.GetListAsync(roleId: matchedRole.Id);
                        dto.MemberCount = members.Count;

                        if (string.IsNullOrWhiteSpace(dto.LeadName))
                        {
                            var leadUser = members.FirstOrDefault();
                            dto.LeadName = leadUser != null ? $"{leadUser.Surname} {leadUser.Name}".Trim() : null;
                        }
                    }
                    else
                    {
                        dto.MemberCount = 0;
                    }
                }
                else
                {
                    dto.MemberCount = 0;
                }

                // 3. THỐNG KÊ TICKET ĐANG MỞ (OpenTickets) - Lấy từ DB thật
                dto.OpenTickets = await AsyncExecuter.CountAsync(
                    ticketQuery.Where(t => t.TeamId == dto.Id && t.Status != TicketStatus.Closed)
                );
            }

            return pagedResult;
        }

        // --- API LẤY DANH SÁCH THÀNH VIÊN THỰC TẾ TỪ CƠ SỞ DỮ LIỆU SQL ---
        [HttpGet]
        [Route("api/app/team/{id}/members")]
        public async Task<List<IdentityUserDto>> GetTeamMembersAsync(long id)
        {
            var team = await Repository.GetAsync(id);
            if (team == null || string.IsNullOrWhiteSpace(team.Code))
            {
                return new List<IdentityUserDto>();
            }

            var roles = await _roleRepository.GetListAsync();
            var matchedRole = roles.FirstOrDefault(r => r.Name.Equals(team.Code, StringComparison.OrdinalIgnoreCase));

            if (matchedRole == null)
            {
                return new List<IdentityUserDto>();
            }

            var users = await _identityUserRepository.GetListAsync(roleId: matchedRole.Id);
            return ObjectMapper.Map<List<Volo.Abp.Identity.IdentityUser>, List<IdentityUserDto>>(users);
        }

        protected override async Task<TeamDto> MapToGetOutputDtoAsync(Team entity)
        {
            var dto = await base.MapToGetOutputDtoAsync(entity);
            ApplyTranslation(dto);
            return dto;
        }

        public override async Task<TeamDto> CreateAsync(CreateUpdateTeamDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.CreateAsync(input);
        }

        public override async Task<TeamDto> UpdateAsync(long id, CreateUpdateTeamDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.UpdateAsync(id, input);
        }

        public override async Task DeleteAsync(long id)
        {
            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var hasActiveTickets = await AsyncExecuter.AnyAsync(ticketQuery.Where(x => x.TeamId == id && x.Status != TicketStatus.Closed));

            if (hasActiveTickets)
            {
                throw new UserFriendlyException(_localizer["TeamHasConstraints"], "TeamHasConstraints");
            }

            var team = await Repository.GetAsync(id);
            team.IsActive = false;
            await Repository.UpdateAsync(team);
        }

        [HttpDelete]
        [Route("api/app/team/{id}/reassign-and-delete")]
        public async Task ReassignAndDeleteAsync(long id, [FromQuery] long replacementId)
        {
            if (id == replacementId)
            {
                throw new UserFriendlyException(_localizer["TeamReplacementConflict"]);
            }

            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var ticketsToMigrate = await AsyncExecuter.ToListAsync(ticketQuery.Where(x => x.TeamId == id));

            foreach (var ticket in ticketsToMigrate)
            {
                ticket.TeamId = replacementId;
                await _ticketRepository.UpdateAsync(ticket);
            }

            var team = await Repository.GetAsync(id);
            team.IsActive = false;
            await Repository.UpdateAsync(team);
        }

        private void ValidateInput(CreateUpdateTeamDto input)
        {
            if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

            if (string.IsNullOrWhiteSpace(input.Code) || input.Code.Trim().Length == 0)
            {
                throw new UserFriendlyException(_localizer["TeamCodeEmpty"]);
            }

            if ((string.IsNullOrWhiteSpace(input.Name_Vi) || input.Name_Vi.Trim().Length == 0) &&
                (string.IsNullOrWhiteSpace(input.Name_En) || input.Name_En.Trim().Length == 0))
            {
                throw new UserFriendlyException(_localizer["TeamNameEmpty"]);
            }
        }

        private void ApplyTranslation(TeamDto dto)
        {
            var currentLang = CultureInfo.CurrentUICulture.Name;

            if (currentLang.StartsWith("vi", StringComparison.OrdinalIgnoreCase))
            {
                dto.Name = !string.IsNullOrWhiteSpace(dto.Name_Vi) ? dto.Name_Vi : (dto.Name_En ?? string.Empty);
            }
            else
            {
                dto.Name = !string.IsNullOrWhiteSpace(dto.Name_En) ? dto.Name_En : (dto.Name_Vi ?? string.Empty);
            }
        }

        private void NormalizeInputLanguages(CreateUpdateTeamDto input)
        {
            if (input == null) return;

            if (!string.IsNullOrWhiteSpace(input.Code)) input.Code = input.Code.Trim();
            if (!string.IsNullOrWhiteSpace(input.Name_Vi)) input.Name_Vi = input.Name_Vi.Trim();
            if (!string.IsNullOrWhiteSpace(input.Name_En)) input.Name_En = input.Name_En.Trim();

            if (string.IsNullOrWhiteSpace(input.Name_Vi) && !string.IsNullOrWhiteSpace(input.Name_En))
            {
                input.Name_Vi = input.Name_En;
            }
            else if (!string.IsNullOrWhiteSpace(input.Name_Vi) && string.IsNullOrWhiteSpace(input.Name_En))
            {
                input.Name_En = input.Name_Vi;
            }
        }
    }
}