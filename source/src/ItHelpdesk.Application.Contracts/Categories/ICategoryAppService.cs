using Volo.Abp.Application.Services;

namespace ItHelpdesk.Categories
{
    public interface ICategoryAppService :
        ICrudAppService<
            CategoryDto,             // 1. DTO trả về cho Client
            long,                    // 2. Kiểu dữ liệu của Khóa chính (Id)
            GetCategoryListInput,    // 3. DTO dùng để phân trang/tìm kiếm
            CreateUpdateCategoryDto, // 4. DTO dùng để Tạo mới (Create)
            CreateUpdateCategoryDto> // 5. DTO dùng để Cập nhật (Update)
    {
 
    }
}