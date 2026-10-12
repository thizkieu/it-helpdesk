using System.Globalization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.KnowledgeBase
{
    public class FaqItemAppService : CrudAppService<
        FaqItem,
        FaqItemDto,
        long,
        PagedAndSortedResultRequestDto,
        CreateUpdateFaqDto>, IFaqItemAppService
    {
        public FaqItemAppService(IRepository<FaqItem, long> repository) : base(repository)
        {
            CreatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            UpdatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            DeletePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
        }

        protected override FaqItemDto MapToGetOutputDto(FaqItem entity)
        {
            var dto = base.MapToGetOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        protected override FaqItemDto MapToGetListOutputDto(FaqItem entity)
        {
            var dto = base.MapToGetListOutputDto(entity);
            ApplyTranslation(dto);
            return dto;
        }

        // Bổ sung: Đồng bộ ngôn ngữ trước khi tạo mới
        public override async Task<FaqItemDto> CreateAsync(CreateUpdateFaqDto input)
        {
            NormalizeLanguages(input);
            return await base.CreateAsync(input);
        }

        // Bổ sung: Đồng bộ ngôn ngữ trước khi cập nhật
        public override async Task<FaqItemDto> UpdateAsync(long id, CreateUpdateFaqDto input)
        {
            NormalizeLanguages(input);
            return await base.UpdateAsync(id, input);
        }

        private void ApplyTranslation(FaqItemDto dto)
        {
            var currentLang = CultureInfo.CurrentUICulture.Name; // "vi" hoặc "en"

            if (currentLang.StartsWith("vi", System.StringComparison.OrdinalIgnoreCase))
            {
                dto.Question = !string.IsNullOrWhiteSpace(dto.Question_Vi) ? dto.Question_Vi : (dto.Question_En ?? string.Empty);
                dto.Answer = !string.IsNullOrWhiteSpace(dto.Answer_Vi) ? dto.Answer_Vi : (dto.Answer_En ?? string.Empty);
            }
            else
            {
                dto.Question = !string.IsNullOrWhiteSpace(dto.Question_En) ? dto.Question_En : (dto.Question_Vi ?? string.Empty);
                dto.Answer = !string.IsNullOrWhiteSpace(dto.Answer_En) ? dto.Answer_En : (dto.Answer_Vi ?? string.Empty);
            }
        }

        // Bổ sung: Hàm tự động điền khuyết ngôn ngữ
        private void NormalizeLanguages(CreateUpdateFaqDto input)
        {
            if (input == null) return;

            // Trim để dọn dẹp khoảng trắng
            if (!string.IsNullOrWhiteSpace(input.Question_Vi)) input.Question_Vi = input.Question_Vi.Trim();
            if (!string.IsNullOrWhiteSpace(input.Question_En)) input.Question_En = input.Question_En.Trim();
            if (!string.IsNullOrWhiteSpace(input.Answer_Vi)) input.Answer_Vi = input.Answer_Vi.Trim();
            if (!string.IsNullOrWhiteSpace(input.Answer_En)) input.Answer_En = input.Answer_En.Trim();

            // Tự động copy ngôn ngữ nếu bị bỏ trống
            if (string.IsNullOrWhiteSpace(input.Question_Vi) && !string.IsNullOrWhiteSpace(input.Question_En))
                input.Question_Vi = input.Question_En;
            else if (!string.IsNullOrWhiteSpace(input.Question_Vi) && string.IsNullOrWhiteSpace(input.Question_En))
                input.Question_En = input.Question_Vi;

            if (string.IsNullOrWhiteSpace(input.Answer_Vi) && !string.IsNullOrWhiteSpace(input.Answer_En))
                input.Answer_Vi = input.Answer_En;
            else if (!string.IsNullOrWhiteSpace(input.Answer_Vi) && string.IsNullOrWhiteSpace(input.Answer_En))
                input.Answer_En = input.Answer_Vi;
        }
    }
}