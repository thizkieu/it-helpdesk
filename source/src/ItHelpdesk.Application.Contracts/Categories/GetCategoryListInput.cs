using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Categories
{
    public class GetCategoryListInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
    }
}