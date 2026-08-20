using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Tickets
{
    [Authorize(ItHelpdeskPermissions.Tickets.Default)]
    public class TicketCommentAppService : ApplicationService, ITicketCommentAppService
    {
        private readonly IRepository<TicketComment, long> _repository;

        public TicketCommentAppService(IRepository<TicketComment, long> repository)
        {
            _repository = repository;
        }

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
    }
}