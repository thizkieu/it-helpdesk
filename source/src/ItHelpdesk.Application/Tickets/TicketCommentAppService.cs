using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ItHelpdesk.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace ItHelpdesk.Tickets
{
    public class TicketCommentAppService : ApplicationService, ITicketCommentAppService
    {
        private readonly IRepository<TicketComment, long> _commentRepository;
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IdentityUserManager _userManager;

        public TicketCommentAppService(
            IRepository<TicketComment, long> commentRepository,
            IRepository<Ticket, long> ticketRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IdentityUserManager userManager)
        {
            _commentRepository = commentRepository;
            _ticketRepository = ticketRepository;
            _userRepository = userRepository;
            _userManager = userManager;
        }

        public async Task<List<TicketCommentDto>> GetListByTicketIdAsync(long ticketId)
        {
            var commentQuery = await _commentRepository.GetQueryableAsync();
            var userQuery = await _userRepository.GetQueryableAsync();

            bool isEndUser = CurrentUser.IsInRole("End_User")
                          || CurrentUser.IsInRole("End User")
                          || CurrentUser.IsInRole("user");

            if (isEndUser)
            {
                commentQuery = commentQuery.Where(x => x.IsInternal == false);
            }

            var comments = from comment in commentQuery
                           join user in userQuery on comment.CreatorId equals user.Id into userGroup
                           from u in userGroup.DefaultIfEmpty()
                           where comment.TicketId == ticketId
                           orderby comment.CreationTime descending // Mới nhất xuất hiện lên đầu tiên
                           select new
                           {
                               Comment = comment,
                               User = u
                           };

            var rawData = await AsyncExecuter.ToListAsync(comments);
            var flatList = new List<TicketCommentDto>();

            foreach (var item in rawData)
            {
                string roleDisplay = "Khách hàng";
                if (item.User != null)
                {
                    var roles = await _userManager.GetRolesAsync(item.User);
                    if (roles.Contains("admin") || roles.Contains("Admin")) roleDisplay = "Quản trị viên";
                    else if (roles.Contains("IT_Technician") || roles.Contains("Technician")) roleDisplay = "Kỹ thuật viên IT";
                }

                flatList.Add(new TicketCommentDto
                {
                    Id = item.Comment.Id,
                    TicketId = item.Comment.TicketId,
                    ParentId = item.Comment.ParentId,
                    Content = item.Comment.Content,
                    IsInternal = item.Comment.IsInternal,
                    CreationTime = item.Comment.CreationTime,
                    CreatorId = item.Comment.CreatorId,
                    CreatorName = item.User != null ? $"{item.User.Surname} {item.User.Name}".Trim() : "Hệ thống",
                    UserRole = roleDisplay,
                    UserAvatar = item.User?.ExtraProperties.ContainsKey("AvatarUrl") == true
                                 ? item.User.ExtraProperties["AvatarUrl"]?.ToString()
                                 : null
                });
            }

            // Xây dựng cấu trúc cây (Tree) nếu muốn gom các bình luận con nằm gọn trong bình luận cha
            var topLevelComments = flatList.Where(x => x.ParentId == null).ToList();
            foreach (var parent in topLevelComments)
            {
                parent.Replies = flatList.Where(x => x.ParentId == parent.Id).OrderBy(x => x.CreationTime).ToList();
            }

            return topLevelComments;
        }

        public async Task<TicketCommentDto> CreateAsync(CreateTicketCommentDto input)
        {
            var ticket = await _ticketRepository.GetAsync(input.TicketId);
            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu này đã đóng, không thể bình luận thêm!");
            }

            // Truyền thêm ParentId vào constructor của entity
            var comment = new TicketComment(input.TicketId, input.Content, input.IsInternal, input.ParentId);
            await _commentRepository.InsertAsync(comment, autoSave: true);

            return ObjectMapper.Map<TicketComment, TicketCommentDto>(comment);
        }

        public async Task<TicketCommentDto> UpdateAsync(long id, UpdateTicketCommentDto input)
        {
            var comment = await _commentRepository.GetAsync(id);

            if (comment.CreatorId != CurrentUser.Id && !CurrentUser.IsInRole("admin"))
            {
                throw new UserFriendlyException("Bạn không có quyền chỉnh sửa bình luận này!");
            }

            var ticket = await _ticketRepository.GetAsync(comment.TicketId);
            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu đã đóng, không thể chỉnh sửa bình luận!");
            }

            comment.Content = input.Content;
            comment.IsInternal = input.IsInternal;

            await _commentRepository.UpdateAsync(comment, autoSave: true);

            return ObjectMapper.Map<TicketComment, TicketCommentDto>(comment);
        }

        public async Task DeleteAsync(long id)
        {
            var comment = await _commentRepository.GetAsync(id);

            if (comment.CreatorId != CurrentUser.Id && !CurrentUser.IsInRole("admin"))
            {
                throw new UserFriendlyException("Bạn không có quyền xóa bình luận này!");
            }

            var ticket = await _ticketRepository.GetAsync(comment.TicketId);
            if (ticket.Status == TicketStatus.Closed)
            {
                throw new UserFriendlyException("Yêu cầu đã đóng, không thể xóa bình luận!");
            }

            await _commentRepository.DeleteAsync(comment, autoSave: true);
        }
    }
}