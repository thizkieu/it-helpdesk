using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Tickets
{
    // Đã gỡ bỏ [Authorize(...)] ở đầu class để người dùng cuối không bị chặn lỗi 403 khi xem comment của ticket
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

            // Sử dụng ToListAsync để tối ưu hiệu năng bất đồng bộ trực tiếp trên database
            var comments = await query.Where(x => x.TicketId == ticketId)
                                      .OrderBy(x => x.CreationTime)
                                      .ToListAsync();

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