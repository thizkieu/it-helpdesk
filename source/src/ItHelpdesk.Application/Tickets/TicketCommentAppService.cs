using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Data;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Tickets
{
    public class TicketCommentAppService : ApplicationService, ITicketCommentAppService
    {
        private readonly IRepository<TicketComment, long> _commentRepository;
        private readonly IRepository<Ticket, long> _ticketRepository;
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IdentityUserManager _userManager;
        private readonly IBlobContainer _blobContainer;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer;

        public TicketCommentAppService(
            IRepository<TicketComment, long> commentRepository,
            IRepository<Ticket, long> ticketRepository,
            IRepository<IdentityUser, Guid> userRepository,
            IdentityUserManager userManager,
            IBlobContainer blobContainer,
            IStringLocalizer<ItHelpdeskResource> localizer)
        {
            _commentRepository = commentRepository;
            _ticketRepository = ticketRepository;
            _userRepository = userRepository;
            _userManager = userManager;
            _blobContainer = blobContainer;
            _localizer = localizer;
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
                           orderby comment.CreationTime descending
                           select new
                           {
                               Comment = comment,
                               User = u
                           };

            var rawData = await AsyncExecuter.ToListAsync(comments);
            var flatList = new List<TicketCommentDto>();

            // TỐI ƯU HIỆU NĂNG N+1: Dùng Dictionary cache kết quả vào RAM để tránh gọi Blob/DB liên tục
            var roleCache = new Dictionary<Guid, string>();
            var avatarCache = new Dictionary<Guid, string>();

            foreach (var item in rawData)
            {
                string roleDisplay = _localizer["Comment:RoleCustomer"].Value;
                string creatorAvatar = "/assets/images/chibi/avatar (1).png";
                string creatorName = item.User != null ? $"{item.User.Surname} {item.User.Name}".Trim() : _localizer["Detail:SystemUser"].Value;

                if (string.IsNullOrWhiteSpace(creatorName) && item.User != null)
                {
                    creatorName = item.User.UserName ?? "User";
                }

                if (item.User != null)
                {
                    // Cache Roles
                    if (!roleCache.ContainsKey(item.User.Id))
                    {
                        var roles = await _userManager.GetRolesAsync(item.User);
                        if (roles.Any(r => r != null && (r.Equals("admin", StringComparison.OrdinalIgnoreCase) || r.Equals("Administrator", StringComparison.OrdinalIgnoreCase))))
                            roleCache[item.User.Id] = _localizer["Comment:RoleAdmin"].Value;
                        else if (roles.Any(r => r != null && (r.Contains("Technician", StringComparison.OrdinalIgnoreCase) || r.Contains("IT", StringComparison.OrdinalIgnoreCase))))
                            roleCache[item.User.Id] = _localizer["Comment:RoleTech"].Value;
                        else
                            roleCache[item.User.Id] = _localizer["Comment:RoleCustomer"].Value;
                    }
                    roleDisplay = roleCache[item.User.Id];

                    // Cache Avatars
                    if (!avatarCache.ContainsKey(item.User.Id))
                    {
                        var blobName = item.User.GetProperty<string>("AvatarBlobName");
                        if (!string.IsNullOrWhiteSpace(blobName))
                        {
                            var bytes = await _blobContainer.GetAllBytesOrNullAsync(blobName);
                            if (bytes != null)
                            {
                                var extension = System.IO.Path.GetExtension(blobName).ToLower();
                                var mimeType = extension switch
                                {
                                    ".png" => "image/png",
                                    ".gif" => "image/gif",
                                    ".webp" => "image/webp",
                                    ".svg" => "image/svg+xml",
                                    _ => "image/jpeg"
                                };
                                avatarCache[item.User.Id] = $"data:{mimeType};base64,{Convert.ToBase64String(bytes)}";
                            }
                        }

                        if (!avatarCache.ContainsKey(item.User.Id))
                        {
                            int totalChibiImages = 29;
                            int imageIndex = (Math.Abs(item.User.UserName.GetHashCode()) % totalChibiImages) + 1;
                            avatarCache[item.User.Id] = $"/assets/images/chibi/avatar ({imageIndex}).png";
                        }
                    }
                    creatorAvatar = avatarCache[item.User.Id];
                }

                flatList.Add(new TicketCommentDto
                {
                    Id = item.Comment.Id,
                    TicketId = item.Comment.TicketId,
                    ParentId = item.Comment.ParentId,
                    Content = item.Comment.Content ?? string.Empty,
                    IsInternal = item.Comment.IsInternal,
                    CreationTime = item.Comment.CreationTime,
                    CreatorId = item.Comment.CreatorId,
                    CreatorName = creatorName,
                    UserRole = roleDisplay,
                    UserAvatar = creatorAvatar
                });
            }

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
            if (ticket.Status == TicketStatus.Closed || (int)ticket.Status == 6)
            {
                throw new UserFriendlyException(_localizer["TicketError:CannotCommentClosed"].Value);
            }

            var comment = new TicketComment(input.TicketId, input.Content, input.IsInternal, input.ParentId);
            await _commentRepository.InsertAsync(comment, autoSave: true);

            var dto = ObjectMapper.Map<TicketComment, TicketCommentDto>(comment);
            dto.Content ??= string.Empty;

            if (CurrentUser.Id.HasValue)
            {
                var currentUserEntity = await _userRepository.FindAsync(CurrentUser.Id.Value);
                if (currentUserEntity != null)
                {
                    dto.CreatorName = $"{currentUserEntity.Surname} {currentUserEntity.Name}".Trim();
                    if (string.IsNullOrWhiteSpace(dto.CreatorName)) dto.CreatorName = currentUserEntity.UserName ?? "User";

                    var roles = await _userManager.GetRolesAsync(currentUserEntity);
                    if (roles.Any(r => r != null && r.Equals("admin", StringComparison.OrdinalIgnoreCase))) dto.UserRole = _localizer["Comment:RoleAdmin"].Value;
                    else if (roles.Any(r => r != null && r.Contains("Technician", StringComparison.OrdinalIgnoreCase))) dto.UserRole = _localizer["Comment:RoleTech"].Value;
                    else dto.UserRole = _localizer["Comment:RoleCustomer"].Value;

                    if (!string.IsNullOrWhiteSpace(currentUserEntity.UserName))
                    {
                        int totalChibiImages = 29;
                        int imageIndex = (Math.Abs(currentUserEntity.UserName.GetHashCode()) % totalChibiImages) + 1;
                        dto.UserAvatar = $"/assets/images/chibi/avatar ({imageIndex}).png";
                    }
                    else
                    {
                        dto.UserAvatar = "/assets/images/chibi/avatar (1).png";
                    }
                }
            }

            return dto;
        }

        public async Task<TicketCommentDto> UpdateAsync(long id, UpdateTicketCommentDto input)
        {
            var comment = await _commentRepository.GetAsync(id);

            bool isAdmin = CurrentUser.IsInRole("admin") || CurrentUser.IsInRole("Admin");
            if (comment.CreatorId != CurrentUser.Id && !isAdmin)
            {
                throw new UserFriendlyException(_localizer["Comment:EditUnauthorized"].Value);
            }

            var ticket = await _ticketRepository.GetAsync(comment.TicketId);
            if (ticket.Status == TicketStatus.Closed || (int)ticket.Status == 6)
            {
                throw new UserFriendlyException(_localizer["Comment:EditClosedTicket"].Value);
            }

            comment.Content = input.Content;
            comment.IsInternal = input.IsInternal;

            await _commentRepository.UpdateAsync(comment, autoSave: true);

            var resultDto = ObjectMapper.Map<TicketComment, TicketCommentDto>(comment);
            resultDto.Content ??= string.Empty;
            return resultDto;
        }

        public async Task DeleteAsync(long id)
        {
            var comment = await _commentRepository.GetAsync(id);

            bool isAdmin = CurrentUser.IsInRole("admin") || CurrentUser.IsInRole("Admin");
            if (comment.CreatorId != CurrentUser.Id && !isAdmin)
            {
                throw new UserFriendlyException(_localizer["Comment:DeleteUnauthorized"].Value);
            }

            var ticket = await _ticketRepository.GetAsync(comment.TicketId);
            if (ticket.Status == TicketStatus.Closed || (int)ticket.Status == 6)
            {
                throw new UserFriendlyException(_localizer["Comment:DeleteClosedTicket"].Value);
            }

            var replies = await _commentRepository.GetListAsync(x => x.ParentId == id);
            if (replies.Any())
            {
                await _commentRepository.DeleteManyAsync(replies);
            }

            await _commentRepository.DeleteAsync(comment, autoSave: true);
        }
    }
}