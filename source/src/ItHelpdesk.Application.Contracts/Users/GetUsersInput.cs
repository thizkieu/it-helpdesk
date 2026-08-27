using Volo.Abp.Application.Dtos;

namespace ItHelpdesk.Users
{
    public class GetUsersInput : PagedAndSortedResultRequestDto
    {
        public string? Filter { get; set; }
        public string? Role { get; set; }
    }
}