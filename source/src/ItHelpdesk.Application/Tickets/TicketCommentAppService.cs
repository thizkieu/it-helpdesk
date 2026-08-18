using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Tickets
{
    public class TicketCommentAppService : ApplicationService, ITicketCommentAppService
    {
        private readonly IRepository<TicketComment, long> _repository;

        public TicketCommentAppService(IRepository<TicketComment, long> repository)
        {
            _repository = repository;
        }

        // 1. Lấy danh sách comment của 1 Ticket cụ thể (Sắp xếp mới nhất xếp dưới cùng)
        public async Task<List<TicketCommentDto>> GetListByTicketIdAsync(long ticketId)
        {
            var query = await _repository.GetQueryableAsync();
            var comments = query.Where(x => x.TicketId == ticketId)
                                .OrderBy(x => x.CreationTime)
                                .ToList();

            return comments.Select(x => new TicketCommentDto
            {
                Id = x.Id,
                TicketId = x.TicketId,
                Content = x.Content,
                IsInternal = x.IsInternal,
                CreationTime = x.CreationTime,
                CreatorId = x.CreatorId
            }).ToList();
        }

        // 2. Thêm mới Comment
        public async Task<TicketCommentDto> CreateAsync(CreateTicketCommentDto input)
        {
            var comment = new TicketComment
            {
                TicketId = input.TicketId,
                Content = input.Content,
                IsInternal = input.IsInternal
            };

            await _repository.InsertAsync(comment, autoSave: true);

            return new TicketCommentDto
            {
                Id = comment.Id,
                TicketId = comment.TicketId,
                Content = comment.Content,
                IsInternal = comment.IsInternal,
                CreationTime = comment.CreationTime,
                CreatorId = comment.CreatorId
            };
        }
    }
}