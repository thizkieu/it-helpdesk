using System;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Tickets
{
    public class TicketAppService : CrudAppService<
        Ticket,
        TicketDto,
        long,
        GetTicketListDto,
        CreateUpdateTicketDto>, ITicketAppService
    {
        public TicketAppService(IRepository<Ticket, long> repository)
            : base(repository)
        {
        }

        public override async Task<TicketDto> CreateAsync(CreateUpdateTicketDto input)
        {
            var ticket = MapToEntity(input);
            ticket.TicketNo = "TK-" + DateTime.Now.ToString("yyyyMMddHHmmss");
            ticket.Status = TicketStatus.New;
            await Repository.InsertAsync(ticket);
            return MapToGetOutputDto(ticket);
        }

        // =========================================================
        // LOGIC LỌC DỮ LIỆU TỪ FRONTEND GỬI XUỐNG
        // =========================================================
        protected override async Task<IQueryable<Ticket>> CreateFilteredQueryAsync(GetTicketListDto input)
        {
            var query = await base.CreateFilteredQueryAsync(input);

            // 1. Lọc theo từ khóa (Tìm trong Tiêu đề hoặc Mã Ticket)
            if (!string.IsNullOrWhiteSpace(input.Filter))
            {
                query = query.Where(x => x.Title.Contains(input.Filter) || x.TicketNo.Contains(input.Filter));
            }

            // 2. Lọc theo trạng thái
            if (input.Status.HasValue)
            {
                var statusEnum = (TicketStatus)input.Status.Value;
                query = query.Where(x => x.Status == statusEnum);
            }

            return query;
        }

        // =========================================================
        // TÍCH HỢP MAPPERLY
        // =========================================================
        protected override Ticket MapToEntity(CreateUpdateTicketDto createInput)
        {
            var mapper = new ItHelpdeskCreateUpdateTicketDtoToTicketMapper();
            return mapper.Map(createInput);
        }

        protected override void MapToEntity(CreateUpdateTicketDto updateInput, Ticket entity)
        {
            var mapper = new ItHelpdeskCreateUpdateTicketDtoToTicketMapper();
            mapper.Map(updateInput, entity);
        }

        protected override TicketDto MapToGetOutputDto(Ticket entity)
        {
            var mapper = new ItHelpdeskTicketToTicketDtoMapper();
            return mapper.Map(entity);
        }

        protected override TicketDto MapToGetListOutputDto(Ticket entity)
        {
            var mapper = new ItHelpdeskTicketToTicketDtoMapper();
            return mapper.Map(entity);
        }
    }
}