using System;
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
// THÊM 2 DÒNG NÀY ĐỂ SỬ DỤNG LOCALIZER
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Priorities
{
    public class PriorityAppService : CrudAppService<
        Priority,
        PriorityDto,
        long,
        GetPriorityListInput,
        CreateUpdatePriorityDto,
        CreateUpdatePriorityDto>,
        IPriorityAppService
    {
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer; // KHAI BÁO LOCALIZER

        public PriorityAppService(
            IRepository<Priority, long> repository,
            IRepository<Ticket, long> ticketRepository,
            IStringLocalizer<ItHelpdeskResource> localizer) : base(repository) // INJECT LOCALIZER
        {
            _ticketRepository = ticketRepository;
            _localizer = localizer;

            CreatePolicyName = ItHelpdeskPermissions.Priorities.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Priorities.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Priorities.Delete;
        }

        protected override async Task<IQueryable<Priority>> CreateFilteredQueryAsync(GetPriorityListInput input)
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

        protected override PriorityDto MapToGetOutputDto(Priority entity)
        {
            var dto = base.MapToGetOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        protected override PriorityDto MapToGetListOutputDto(Priority entity)
        {
            var dto = base.MapToGetListOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        public override async Task<PriorityDto> CreateAsync(CreateUpdatePriorityDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.CreateAsync(input);
        }

        public override async Task<PriorityDto> UpdateAsync(long id, CreateUpdatePriorityDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.UpdateAsync(id, input);
        }

        public override async Task DeleteAsync(long id)
        {
            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var hasActiveTickets = await AsyncExecuter.AnyAsync(ticketQuery.Where(x => x.PriorityId == id && x.Status != TicketStatus.Closed));

            if (hasActiveTickets)
            {
                // GỌI KEY JSON THAY VÌ HARD-CODE TIẾNG VIỆT
                throw new UserFriendlyException(_localizer["PriorityHasConstraints"], "PriorityHasConstraints");
            }

            var priority = await Repository.GetAsync(id);
            priority.IsActive = false;
            await Repository.UpdateAsync(priority);
        }

        [HttpDelete]
        [Route("api/app/priority/{id}/reassign-and-delete")]
        public async Task ReassignAndDeleteAsync(long id, [FromQuery] long replacementId)
        {
            if (id == replacementId)
            {
                // GỌI KEY JSON
                throw new UserFriendlyException(_localizer["PriorityReplacementConflict"]);
            }

            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var ticketsToMigrate = await AsyncExecuter.ToListAsync(ticketQuery.Where(x => x.PriorityId == id));

            foreach (var ticket in ticketsToMigrate)
            {
                ticket.PriorityId = replacementId;
                await _ticketRepository.UpdateAsync(ticket);
            }

            var priority = await Repository.GetAsync(id);
            priority.IsActive = false;
            await Repository.UpdateAsync(priority);
        }

        private void ValidateInput(CreateUpdatePriorityDto input)
        {
            if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

            if (string.IsNullOrWhiteSpace(input.Code) || input.Code.Trim().Length == 0)
            {
                throw new UserFriendlyException(_localizer["PriorityCodeEmpty"]);
            }

            if ((string.IsNullOrWhiteSpace(input.Name_Vi) || input.Name_Vi.Trim().Length == 0) &&
                (string.IsNullOrWhiteSpace(input.Name_En) || input.Name_En.Trim().Length == 0))
            {
                throw new UserFriendlyException(_localizer["PriorityNameEmpty"]);
            }
        }

        private void ApplyTranslation(PriorityDto dto)
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

        private void NormalizeInputLanguages(CreateUpdatePriorityDto input)
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