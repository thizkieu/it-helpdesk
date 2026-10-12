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

namespace ItHelpdesk.Services
{
    public class ServiceAppService : CrudAppService<
        Service,
        ServiceDto,
        long,
        GetServiceListInput,
        CreateUpdateServiceDto,
        CreateUpdateServiceDto>, IServiceAppService
    {
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer; // KHAI BÁO LOCALIZER

        public ServiceAppService(
            IRepository<Service, long> repository,
            IRepository<Ticket, long> ticketRepository,
            IStringLocalizer<ItHelpdeskResource> localizer) : base(repository) // INJECT LOCALIZER
        {
            _ticketRepository = ticketRepository;
            _localizer = localizer;

            CreatePolicyName = ItHelpdeskPermissions.Services.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Services.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Services.Delete;
        }

        protected override async Task<IQueryable<Service>> CreateFilteredQueryAsync(GetServiceListInput input)
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

        protected override ServiceDto MapToGetOutputDto(Service entity)
        {
            var dto = base.MapToGetOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        protected override ServiceDto MapToGetListOutputDto(Service entity)
        {
            var dto = base.MapToGetListOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        public override async Task<ServiceDto> CreateAsync(CreateUpdateServiceDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.CreateAsync(input);
        }

        public override async Task<ServiceDto> UpdateAsync(long id, CreateUpdateServiceDto input)
        {
            ValidateInput(input);
            NormalizeInputLanguages(input);
            return await base.UpdateAsync(id, input);
        }

        // Ghi đè phương thức Xóa: Kiểm tra ràng buộc Ticket trước khi vô hiệu hóa
        public override async Task DeleteAsync(long id)
        {
            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var hasActiveTickets = await AsyncExecuter.AnyAsync(ticketQuery.Where(x => x.ServiceId == id && x.Status != TicketStatus.Closed));

            if (hasActiveTickets)
            {
                throw new UserFriendlyException(_localizer["ServiceHasConstraints"], "ServiceHasConstraints");
            }

            var service = await Repository.GetAsync(id);
            service.IsActive = false; // Vô hiệu hóa mềm
            await Repository.UpdateAsync(service);
        }

        // API phụ trợ: Chuyển toàn bộ vé sang dịch vụ mới và vô hiệu hóa mức cũ
        [HttpDelete]
        [Route("api/app/service/{id}/reassign-and-delete")]
        public async Task ReassignAndDeleteAsync(long id, [FromQuery] long replacementId)
        {
            if (id == replacementId)
            {
                throw new UserFriendlyException(_localizer["ServiceReplacementConflict"]);
            }

            var ticketQuery = await _ticketRepository.GetQueryableAsync();
            var ticketsToMigrate = await AsyncExecuter.ToListAsync(ticketQuery.Where(x => x.ServiceId == id));

            foreach (var ticket in ticketsToMigrate)
            {
                ticket.ServiceId = replacementId;
                await _ticketRepository.UpdateAsync(ticket);
            }

            var service = await Repository.GetAsync(id);
            service.IsActive = false;
            await Repository.UpdateAsync(service);
        }

        private void ValidateInput(CreateUpdateServiceDto input)
        {
            if (input == null) throw new UserFriendlyException(_localizer["Error:Generic"]);

            if (string.IsNullOrWhiteSpace(input.Code) || input.Code.Trim().Length == 0)
            {
                throw new UserFriendlyException(_localizer["ServiceCodeEmpty"]);
            }

            if ((string.IsNullOrWhiteSpace(input.Name_Vi) || input.Name_Vi.Trim().Length == 0) &&
                (string.IsNullOrWhiteSpace(input.Name_En) || input.Name_En.Trim().Length == 0))
            {
                throw new UserFriendlyException(_localizer["ServiceNameEmpty"]);
            }
        }

        private void ApplyTranslation(ServiceDto dto)
        {
            var currentLang = CultureInfo.CurrentUICulture.Name;

            if (currentLang.StartsWith("vi", StringComparison.OrdinalIgnoreCase))
            {
                dto.Name = !string.IsNullOrWhiteSpace(dto.Name_Vi) ? dto.Name_Vi : dto.Name_En;
                dto.Description = !string.IsNullOrWhiteSpace(dto.Description_Vi) ? dto.Description_Vi : dto.Description_En;
            }
            else
            {
                dto.Name = !string.IsNullOrWhiteSpace(dto.Name_En) ? dto.Name_En : dto.Name_Vi;
                dto.Description = !string.IsNullOrWhiteSpace(dto.Description_En) ? dto.Description_En : dto.Description_Vi;
            }
        }

        private void NormalizeInputLanguages(CreateUpdateServiceDto input)
        {
            // Làm sạch khoảng trắng
            if (!string.IsNullOrWhiteSpace(input.Code)) input.Code = input.Code.Trim();
            if (!string.IsNullOrWhiteSpace(input.Name_Vi)) input.Name_Vi = input.Name_Vi.Trim();
            if (!string.IsNullOrWhiteSpace(input.Name_En)) input.Name_En = input.Name_En.Trim();
            if (!string.IsNullOrWhiteSpace(input.Description_Vi)) input.Description_Vi = input.Description_Vi.Trim();
            if (!string.IsNullOrWhiteSpace(input.Description_En)) input.Description_En = input.Description_En.Trim();

            // Đồng bộ tên
            if (string.IsNullOrWhiteSpace(input.Name_Vi) && !string.IsNullOrWhiteSpace(input.Name_En))
            {
                input.Name_Vi = input.Name_En;
            }
            else if (!string.IsNullOrWhiteSpace(input.Name_Vi) && string.IsNullOrWhiteSpace(input.Name_En))
            {
                input.Name_En = input.Name_Vi;
            }

            // Đồng bộ mô tả
            if (string.IsNullOrWhiteSpace(input.Description_Vi) && !string.IsNullOrWhiteSpace(input.Description_En))
            {
                input.Description_Vi = input.Description_En;
            }
            else if (!string.IsNullOrWhiteSpace(input.Description_Vi) && string.IsNullOrWhiteSpace(input.Description_En))
            {
                input.Description_En = input.Description_Vi;
            }
        }
    }
}