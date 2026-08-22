using Microsoft.AspNetCore.Authorization;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.KnowledgeBase
{
    // Đã gỡ bỏ [Authorize(...)] ở đầu class để End User có thể xem cẩm nang hướng dẫn
    public class FaqItemAppService : CrudAppService<
        FaqItem,
        FaqItemDto,
        long,
        PagedAndSortedResultRequestDto,
        CreateUpdateFaqDto>, IFaqItemAppService
    {
        public FaqItemAppService(IRepository<FaqItem, long> repository) : base(repository)
        {
            // Mở công khai quyền đọc/xem danh sách cho mọi người dùng đã đăng nhập
            // GetPolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            // GetListPolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;

            // Giữ lại hoặc mở khóa quyền Thêm/Sửa/Xóa tùy theo phân quyền thực tế của bạn
            CreatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            UpdatePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
            DeletePolicyName = ItHelpdeskPermissions.KnowledgeBase.Default;
        }
    }
}