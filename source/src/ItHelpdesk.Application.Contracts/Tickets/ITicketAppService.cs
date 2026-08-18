using Volo.Abp.Application.Services;

namespace ItHelpdesk.Tickets
{
    public interface ITicketAppService : ICrudAppService<
        TicketDto,
        long,
        GetTicketListDto,
        CreateUpdateTicketDto>
    {
    }
}