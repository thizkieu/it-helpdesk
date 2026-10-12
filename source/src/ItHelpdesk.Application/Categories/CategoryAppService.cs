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
// THÊM DÒNG NÀY ĐỂ DÙNG L10N
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Categories
{
    public class CategoryAppService : CrudAppService<
        Category,
        CategoryDto,
        long,
        GetCategoryListInput,
        CreateUpdateCategoryDto,
        CreateUpdateCategoryDto>,
        ICategoryAppService
    {
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer; // KHAI BÁO LOCALIZER

        public CategoryAppService(
            IRepository<Category, long> repository,
            IRepository<Ticket, long> ticketRepository,
            IStringLocalizer<ItHelpdeskResource> localizer) : base(repository) // INJECT LOCALIZER
        {
            _ticketRepository = ticketRepository;
            _localizer = localizer;

            CreatePolicyName = ItHelpdeskPermissions.Categories.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Categories.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Categories.Delete;
        }

        protected override async Task<IQueryable<Category>> CreateFilteredQueryAsync(GetCategoryListInput input)
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

        protected override CategoryDto MapToGetOutputDto(Category entity)
        {
            var dto = base.MapToGetOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        protected override CategoryDto MapToGetListOutputDto(Category entity)
        {
            var dto = base.MapToGetListOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        public override async Task<CategoryDto> CreateAsync(CreateUpdateCategoryDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.CreateAsync(input);
        }

        public override async Task<CategoryDto> UpdateAsync(long id, CreateUpdateCategoryDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.UpdateAsync(id, input);
        }

        public override async Task DeleteAsync(long id)
        {
            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var hasActiveTickets = await AsyncExecuter.AnyAsync(ticketQuery.Where(x => x.CategoryId == id && x.Status != TicketStatus.Closed));

            if (hasActiveTickets)
            {
                // SỬ DỤNG KEY TỪ FILE JSON THAY VÌ GÕ CỨNG TIẾNG VIỆT
                throw new UserFriendlyException(_localizer["CategoryHasConstraints"], "CategoryHasConstraints");
            }

            var category = await Repository.GetAsync(id);
            category.IsActive = false;
            await Repository.UpdateAsync(category);
        }

        [HttpDelete]
        [Route("api/app/category/{id}/reassign-and-delete")]
        public async Task ReassignAndDeleteAsync(long id, [FromQuery] long replacementId)
        {
            if (id == replacementId)
            {
                // SỬ DỤNG KEY TỪ FILE JSON
                throw new UserFriendlyException(_localizer["CategoryReplacementConflict"]);
            }

            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var ticketsToMigrate = await AsyncExecuter.ToListAsync(ticketQuery.Where(x => x.CategoryId == id));

            foreach (var ticket in ticketsToMigrate)
            {
                ticket.CategoryId = replacementId;
                await _ticketRepository.UpdateAsync(ticket);
            }

            var category = await Repository.GetAsync(id);
            category.IsActive = false;
            await Repository.UpdateAsync(category);
        }

        private void ValidateInput(CreateUpdateCategoryDto input)
        {
            if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

            if (string.IsNullOrWhiteSpace(input.Code) || input.Code.Trim().Length == 0)
            {
                throw new UserFriendlyException(_localizer["CategoryCodeEmpty"]);
            }

            if ((string.IsNullOrWhiteSpace(input.Name_Vi) || input.Name_Vi.Trim().Length == 0) &&
                (string.IsNullOrWhiteSpace(input.Name_En) || input.Name_En.Trim().Length == 0))
            {
                throw new UserFriendlyException(_localizer["CategoryNameEmpty"]);
            }
        }

        private void ApplyTranslation(CategoryDto dto)
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

        private void NormalizeInputLanguages(CreateUpdateCategoryDto input)
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