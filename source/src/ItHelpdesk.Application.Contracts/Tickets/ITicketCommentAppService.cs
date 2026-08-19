using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace ItHelpdesk.Tickets
{
    public interface ITicketCommentAppService : IApplicationService
    {
        Task<List<TicketCommentDto>> GetListByTicketIdAsync(long ticketId);
    }
}