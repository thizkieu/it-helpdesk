using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Categories;
using ItHelpdesk.Notifications;
using ItHelpdesk.Permissions;
using ItHelpdesk.Priorities;
using ItHelpdesk.Provider;
using ItHelpdesk.Provider.Request;
using ItHelpdesk.Provider.Response;
using ItHelpdesk.Services;
using ItHelpdesk.SignalR;
using ItHelpdesk.Teams;
using ItHelpdesk.Users;
using ItHelpdesk.SysMasterLists;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Data;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Microsoft.Extensions.Localization;
using ItHelpdesk.Localization;
using Microsoft.Extensions.Logging;

namespace ItHelpdesk.Tickets
{
    public class ChangeTicketStatusInput { public long TicketId { get; set; } public TicketStatus NewStatus { get; set; } public string? Comment { get; set; } }
    public class CancelTicketInput { public string? Reason { get; set; } }
    public class GetSystemHistoryInput : PagedAndSortedResultRequestDto { public DateTime? StartDate { get; set; } public DateTime? EndDate { get; set; } public string? FilterText { get; set; } public bool IsPersonal { get; set; } = false; }

    public class TicketAppService : CrudAppService<Ticket, TicketDto, long, GetTicketListDto, CreateUpdateTicketDto>, ITicketAppService
    {
        private readonly IRepository<TicketActivity, long> _ticketActivityRepository;
        private readonly IRepository<TicketComment, long> _ticketCommentRepository;
        private readonly IRepository<IdentityUser, Guid> _userRepository;
        private readonly IBlobContainer _blobContainer;
        private readonly IRepository<TicketAttachment, long> _attachmentRepository;
        private readonly IRepository<Priority, long> _priorityRepository;
        private readonly IRepository<Category, long> _categoryRepository;
        private readonly IRepository<Service, long> _serviceRepository;
        private readonly IRepository<Team, long> _teamRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITicketProvider _ticketProvider;
        private readonly IdentityUserManager _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IRepository<AppNotification, Guid> _notificationRepository;
        private readonly IStringLocalizer<ItHelpdeskResource> _localizer;
        private readonly ISysMasterListAppService _sysMasterListAppService;

        public TicketAppService(
            IRepository<Ticket, long> repository, IRepository<TicketActivity, long> ticketActivityRepository,
            IRepository<TicketComment, long> ticketCommentRepository, IRepository<IdentityUser, Guid> userRepository,
            IBlobContainer blobContainer, IRepository<TicketAttachment, long> attachmentRepository,
            IRepository<Priority, long> priorityRepository, IRepository<Category, long> categoryRepository,
            IRepository<Service, long> serviceRepository, IRepository<Team, long> teamRepository,
            IHttpContextAccessor httpContextAccessor, ITicketProvider ticketProvider,
            IdentityUserManager userManager, IHubContext<NotificationHub> hubContext,
            IRepository<AppNotification, Guid> notificationRepository, IStringLocalizer<ItHelpdeskResource> localizer,
            ISysMasterListAppService sysMasterListAppService) : base(repository)
        {
            _ticketActivityRepository = ticketActivityRepository; _ticketCommentRepository = ticketCommentRepository;
            _userRepository = userRepository; _blobContainer = blobContainer;
            _attachmentRepository = attachmentRepository; _priorityRepository = priorityRepository;
            _categoryRepository = categoryRepository; _serviceRepository = serviceRepository;
            _teamRepository = teamRepository; _httpContextAccessor = httpContextAccessor;
            _ticketProvider = ticketProvider; _userManager = userManager;
            _hubContext = hubContext; _notificationRepository = notificationRepository;
            _localizer = localizer; _sysMasterListAppService = sysMasterListAppService;
            CreatePolicyName = ItHelpdeskPermissions.Tickets.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Tickets.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Tickets.Delete;
        }

        // Logic Dashboard & KPI...
        [Authorize(ItHelpdeskPermissions.Dashboard.Default)]
        [HttpGet]
        [Route("api/app/dashboard/statistics")]
        public async Task<DashboardStatsDto> GetDashboardStatsAsync([FromQuery] GetDashboardStatsInput input)
        {
            var query = await Repository.GetQueryableAsync();
            if (input.StartDate.HasValue) query = query.Where(x => x.CreationTime >= input.StartDate.Value);
            if (input.EndDate.HasValue) query = query.Where(x => x.CreationTime <= input.EndDate.Value);
            if (input.AssigneeId.HasValue) query = query.Where(x => x.AssigneeId == input.AssigneeId.Value);
            if (input.TeamId.HasValue) query = query.Where(x => x.TeamId == input.TeamId.Value);

            var totalTickets = await AsyncExecuter.CountAsync(query);
            var unassignedTickets = await AsyncExecuter.CountAsync(query.Where(x => x.AssigneeId == null && x.Status != TicketStatus.Closed && x.Status != (TicketStatus)7));
            var now = DateTime.Now;

            var resolvedCount = await AsyncExecuter.CountAsync(query.Where(x => x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Completed || x.Status == (TicketStatus)5 || x.Status == (TicketStatus)6));
            var closedCount = await AsyncExecuter.CountAsync(query.Where(x => x.Status == TicketStatus.Closed || x.Status == (TicketStatus)7));

            var overdueTickets = await AsyncExecuter.CountAsync(query.Where(x =>
                x.Status != TicketStatus.Resolved && x.Status != TicketStatus.Completed && x.Status != TicketStatus.Closed &&
                x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7 &&
                x.TargetResolutionTime.HasValue && x.TargetResolutionTime.Value < now));

            var openOnTimeCount = await AsyncExecuter.CountAsync(query.Where(x =>
                x.Status != TicketStatus.Resolved && x.Status != TicketStatus.Completed && x.Status != TicketStatus.Closed &&
                x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7 &&
                (!x.TargetResolutionTime.HasValue || x.TargetResolutionTime.Value >= now)));

            var totalCompletedTickets = await AsyncExecuter.CountAsync(query.Where(x =>
                (x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Completed || x.Status == TicketStatus.Closed || x.Status == (TicketStatus)5 || x.Status == (TicketStatus)6 || x.Status == (TicketStatus)7) &&
                x.ResolvedAt.HasValue && x.TargetResolutionTime.HasValue));

            var onTimeCount = await AsyncExecuter.CountAsync(query.Where(x =>
                (x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Completed || x.Status == TicketStatus.Closed || x.Status == (TicketStatus)5 || x.Status == (TicketStatus)6 || x.Status == (TicketStatus)7) &&
                x.ResolvedAt.HasValue && x.TargetResolutionTime.HasValue && x.ResolvedAt.Value <= x.TargetResolutionTime.Value));

            double complianceRate = totalCompletedTickets > 0 ? Math.Round((double)onTimeCount / totalCompletedTickets * 100, 2) : (totalTickets > 0 && overdueTickets == 0 ? 100.0 : 0.0);

            var statusDistribution = new List<ChartItemDto>
            {
                new ChartItemDto { Name = _localizer["Dashboard:ChartStatusInProgress"].Value ?? "Đang xử lý (Đúng hạn)", Value = openOnTimeCount },
                new ChartItemDto { Name = _localizer["Dashboard:ChartStatusResolved"].Value ?? "Đã hoàn thành", Value = resolvedCount },
                new ChartItemDto { Name = _localizer["Dashboard:ChartStatusClosed"].Value ?? "Đóng / Hủy", Value = closedCount },
                new ChartItemDto { Name = _localizer["Dashboard:StatusOverdue"].Value ?? "Quá hạn SLA", Value = overdueTickets }
            }.Where(x => x.Value > 0).ToList();

            var insights = new List<string>();
            if (totalTickets == 0) insights.Add("Không có dữ liệu trong khoảng thời gian này.");

            return new DashboardStatsDto
            {
                TotalTickets = totalTickets,
                NewTickets = openOnTimeCount,
                UnassignedTickets = unassignedTickets,
                ResolvedTickets = resolvedCount,
                OverdueTickets = overdueTickets,
                SlaComplianceRate = complianceRate,
                SmartInsights = insights,
                StatusDistribution = statusDistribution
            };
        }

        [Authorize(ItHelpdeskPermissions.Dashboard.Default)]
        [HttpGet]
        [Route("api/app/dashboard/technician-kpi")]
        public async Task<List<TechnicianKpiDto>> GetTechnicianKpisAsync([FromQuery] GetDashboardStatsInput input, [FromQuery] int? month = null, [FromQuery] int? year = null)
        {
            var queryUsers = await _userRepository.GetQueryableAsync();
            var allActiveUsers = await AsyncExecuter.ToListAsync(queryUsers.Where(x => x.IsActive));
            var endUsers = await _userManager.GetUsersInRoleAsync("End_User");
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            var excludedUserIds = endUsers.Select(x => x.Id).Concat(adminUsers.Select(x => x.Id)).ToList();
            var allTechnicians = allActiveUsers.Where(x => !excludedUserIds.Contains(x.Id)).ToList();
            var query = await Repository.GetQueryableAsync();
            if (year.HasValue && year.Value > 0) query = query.Where(x => x.CreationTime.Year == year.Value || (x.ResolvedAt.HasValue && x.ResolvedAt.Value.Year == year.Value));
            if (month.HasValue && month.Value > 0) query = query.Where(x => x.CreationTime.Month == month.Value || (x.ResolvedAt.HasValue && x.ResolvedAt.Value.Month == month.Value));
            if (input.StartDate.HasValue) query = query.Where(x => x.CreationTime >= input.StartDate.Value);
            if (input.EndDate.HasValue) query = query.Where(x => x.CreationTime <= input.EndDate.Value);
            if (input.AssigneeId.HasValue)
            {
                query = query.Where(x => x.AssigneeId == input.AssigneeId.Value);
                allTechnicians = allTechnicians.Where(x => x.Id == input.AssigneeId.Value).ToList();
            }
            if (input.TeamId.HasValue) query = query.Where(x => x.TeamId == input.TeamId.Value);

            var assignedTickets = await AsyncExecuter.ToListAsync(query.Where(x => x.AssigneeId != null));
            var ticketsByTech = assignedTickets.GroupBy(x => x.AssigneeId.Value).ToDictionary(g => g.Key, g => g.ToList());
            var result = new List<TechnicianKpiDto>();
            var now = DateTime.Now;

            foreach (var tech in allTechnicians)
            {
                decimal baseSalary = 12000000m;
                if (tech.HasProperty("BaseSalary")) baseSalary = tech.GetProperty<decimal>("BaseSalary");
                decimal bonusPerPercent = 100000m;
                decimal penaltyPerTicket = 200000m;
                var techTickets = ticketsByTech.ContainsKey(tech.Id) ? ticketsByTech[tech.Id] : new List<Ticket>();
                int totalAssigned = techTickets.Count;
                var userRoles = await _userManager.GetRolesAsync(tech);
                string roleName = userRoles.Any(r => r.IndexOf("lead", StringComparison.OrdinalIgnoreCase) >= 0 || r.IndexOf("trưởng", StringComparison.OrdinalIgnoreCase) >= 0) ? "Trưởng nhóm" : "Kỹ thuật viên";
                string teamName = "Đội IT Mặc định";
                var techTeamIds = techTickets.Where(x => x.TeamId.HasValue).Select(x => x.TeamId!.Value).ToList();
                if (techTeamIds.Any())
                {
                    var topTeamId = techTeamIds.GroupBy(x => x).OrderByDescending(g => g.Count()).First().Key;
                    var teamEntity = await _teamRepository.FindAsync(topTeamId);
                    if (teamEntity != null) teamName = teamEntity.Name_Vi;
                }
                if (totalAssigned == 0)
                {
                    result.Add(new TechnicianKpiDto
                    {
                        Id = tech.Id,
                        Name = string.IsNullOrWhiteSpace($"{tech.Surname} {tech.Name}") ? tech.UserName : $"{tech.Surname} {tech.Name}".Trim(),
                        Email = tech.Email ?? "",
                        RoleName = roleName,
                        TeamName = teamName,
                        TotalAssigned = 0,
                        InProgressTickets = 0,
                        OnTimeRate = 0,
                        OverdueRate = 0,
                        BaseSalary = baseSalary,
                        BonusAmount = 0,
                        PenaltyAmount = 0,
                        NetSalary = baseSalary
                    });
                    continue;
                }
                int inProgress = techTickets.Count(x => x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7);
                int onTime = techTickets.Count(x => x.TargetResolutionTime.HasValue && x.ResolvedAt.HasValue && x.ResolvedAt.Value <= x.TargetResolutionTime.Value);
                int overdue = techTickets.Count(x => x.TargetResolutionTime.HasValue && ((x.ResolvedAt.HasValue && x.ResolvedAt.Value > x.TargetResolutionTime.Value) || (!x.ResolvedAt.HasValue && x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7 && now > x.TargetResolutionTime.Value)));
                double onTimeRate = Math.Round((double)onTime / totalAssigned * 100, 2);
                double overdueRate = Math.Round((double)overdue / totalAssigned * 100, 2);
                decimal bonus = onTimeRate > 90 ? (decimal)(onTimeRate - 90) * bonusPerPercent : 0m;
                decimal penalty = overdue * penaltyPerTicket;

                result.Add(new TechnicianKpiDto
                {
                    Id = tech.Id,
                    Name = string.IsNullOrWhiteSpace($"{tech.Surname} {tech.Name}") ? tech.UserName : $"{tech.Surname} {tech.Name}".Trim(),
                    Email = tech.Email ?? "",
                    RoleName = roleName,
                    TeamName = teamName,
                    TotalAssigned = totalAssigned,
                    InProgressTickets = inProgress,
                    OnTimeRate = onTimeRate,
                    OverdueRate = overdueRate,
                    BaseSalary = baseSalary,
                    BonusAmount = Math.Round(bonus, 0),
                    PenaltyAmount = Math.Round(penalty, 0),
                    NetSalary = Math.Max(0, baseSalary + bonus - penalty)
                });
            }
            return result.OrderBy(x => x.OverdueRate).ThenByDescending(x => x.OnTimeRate).ThenByDescending(x => x.TotalAssigned).ThenBy(x => x.Name).ToList();
        }

        [Authorize(ItHelpdeskPermissions.Dashboard.Default)]
        [HttpGet]
        [Route("api/app/dashboard/technician-detail/{id}")]
        public async Task<object> GetTechnicianDetailAsync(Guid id, [FromQuery] int? month = null, [FromQuery] int? year = null)
        {
            var tech = await _userRepository.GetAsync(id);
            if (tech == null) throw new UserFriendlyException("Không tìm thấy nhân sự");
            var query = await Repository.GetQueryableAsync();
            if (year.HasValue && year.Value > 0) query = query.Where(x => x.CreationTime.Year == year.Value || (x.ResolvedAt.HasValue && x.ResolvedAt.Value.Year == year.Value));
            if (month.HasValue && month.Value > 0) query = query.Where(x => x.CreationTime.Month == month.Value || (x.ResolvedAt.HasValue && x.ResolvedAt.Value.Month == month.Value));
            var techTickets = await AsyncExecuter.ToListAsync(query.Include(x => x.Category).Include(x => x.Priority).Where(x => x.AssigneeId == id));
            int totalAssigned = techTickets.Count;
            int onTime = techTickets.Count(x => x.TargetResolutionTime.HasValue && x.ResolvedAt.HasValue && x.ResolvedAt.Value <= x.TargetResolutionTime.Value);
            int overdue = techTickets.Count(x => x.TargetResolutionTime.HasValue && ((x.ResolvedAt.HasValue && x.ResolvedAt.Value > x.TargetResolutionTime.Value) || (!x.ResolvedAt.HasValue && x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7 && DateTime.Now > x.TargetResolutionTime.Value)));
            var userRoles = await _userManager.GetRolesAsync(tech);
            string roleName = userRoles.Any(r => r.IndexOf("lead", StringComparison.OrdinalIgnoreCase) >= 0 || r.IndexOf("trưởng", StringComparison.OrdinalIgnoreCase) >= 0) ? "Trưởng nhóm" : "Kỹ thuật viên";
            return new
            {
                technicianInfo = new { id = tech.Id, name = string.IsNullOrWhiteSpace($"{tech.Surname} {tech.Name}") ? tech.UserName : $"{tech.Surname} {tech.Name}".Trim(), email = tech.Email ?? "", roleName = roleName, totalAssigned = totalAssigned, onTimeRate = totalAssigned > 0 ? Math.Round((double)onTime / totalAssigned * 100, 2) : 0, overdueRate = totalAssigned > 0 ? Math.Round((double)overdue / totalAssigned * 100, 2) : 0 },
                tickets = techTickets.OrderByDescending(x => x.CreationTime).Select(t => new { id = t.Id, ticketNo = t.TicketNo, title = t.Title, status = (int)t.Status, creationTime = t.CreationTime, targetResolutionTime = t.TargetResolutionTime, categoryName = t.Category?.Name_Vi ?? "---", priorityName = t.Priority?.Name_Vi ?? "---" }).ToList()
            };
        }

        [HttpGet]
        [Route("api/app/ticket/sla-gauge-explanation")]
        public async Task<SlaGaugeCalculationExplanationDto> GetSlaGaugeExplanationAsync([FromQuery] GetDashboardStatsInput input)
        {
            var query = await Repository.GetQueryableAsync();
            if (input.StartDate.HasValue) query = query.Where(x => x.CreationTime >= input.StartDate.Value);
            if (input.EndDate.HasValue) query = query.Where(x => x.CreationTime <= input.EndDate.Value);
            if (input.AssigneeId.HasValue) query = query.Where(x => x.AssigneeId == input.AssigneeId.Value);
            if (input.TeamId.HasValue) query = query.Where(x => x.TeamId == input.TeamId.Value);
            var totalCompleted = await AsyncExecuter.CountAsync(query.Where(x => x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Completed || x.Status == TicketStatus.Closed || x.Status == (TicketStatus)5 || x.Status == (TicketStatus)6 || x.Status == (TicketStatus)7));
            var onTime = await AsyncExecuter.CountAsync(query.Where(x => (x.Status == TicketStatus.Resolved || x.Status == TicketStatus.Completed || x.Status == TicketStatus.Closed || x.Status == (TicketStatus)5 || x.Status == (TicketStatus)6 || x.Status == (TicketStatus)7) && x.ResolvedAt.HasValue && x.TargetResolutionTime.HasValue && x.ResolvedAt.Value <= x.TargetResolutionTime.Value));
            var overdue = await AsyncExecuter.CountAsync(query.Where(x => x.TargetResolutionTime.HasValue && ((x.ResolvedAt.HasValue && x.ResolvedAt.Value > x.TargetResolutionTime.Value) || (!x.ResolvedAt.HasValue && x.Status != (TicketStatus)5 && x.Status != (TicketStatus)6 && x.Status != (TicketStatus)7 && DateTime.Now > x.TargetResolutionTime.Value))));
            double rawRate = totalCompleted > 0 ? Math.Round((double)onTime / totalCompleted * 100, 2) : (overdue > 0 ? 0.0 : 100.0);
            double penaltyWeight = overdue * 1.5;
            double finalScore = Math.Max(0, Math.Min(100, rawRate - penaltyWeight));
            finalScore = Math.Round(finalScore, 2);
            return new SlaGaugeCalculationExplanationDto
            {
                FinalScore = finalScore,
                TotalCompletedTickets = totalCompleted,
                OnTimeCount = onTime,
                OverdueCount = overdue,
                RawComplianceRate = rawRate,
                FormulaDescription = "Điểm Gauge = Tỉ lệ đúng hạn thô - Phạt quá hạn",
                BreakdownLogs = new List<string>()
            };
        }

        public override async Task<PagedResultDto<TicketDto>> GetListAsync(GetTicketListDto input)
        {
            var query = await Repository.GetQueryableAsync();
            var totalCount = await AsyncExecuter.CountAsync(query);
            var items = await AsyncExecuter.ToListAsync(query.PageBy(input));
            return new PagedResultDto<TicketDto>(totalCount, ObjectMapper.Map<List<Ticket>, List<TicketDto>>(items));
        }

        // ==============================================================
        // BỔ SUNG CÁC HÀM TẠO VÀ GỬI THÔNG BÁO CHO HỆ THỐNG
        // ==============================================================

        public override async Task<TicketDto> CreateAsync(CreateUpdateTicketDto input)
        {
            var ticket = MapToEntity(input);
            ticket.TicketNo = "TK-" + DateTime.Now.ToString("yyMMddHHmmss");
            ticket.Status = TicketStatus.New;

            // Khởi tạo SLA dự kiến
            ticket.TargetResponseTime = DateTime.Now.AddDays(1);
            ticket.TargetResolutionTime = DateTime.Now.AddDays(3);

            await Repository.InsertAsync(ticket, autoSave: true);

            // Lưu lịch sử hoạt động
            var activity = new TicketActivity(ticket.Id, "TicketCreated", "Yêu cầu mới được tạo");
            await _ticketActivityRepository.InsertAsync(activity, autoSave: true);

            // GỬI THÔNG BÁO: Tạo vé thành công
            var notificationService = LazyServiceProvider.LazyGetRequiredService<INotificationAppService>();
            if (notificationService != null)
            {
                var creatorName = CurrentUser.UserName ?? "User";
                await notificationService.NotifyNewTicketCreatedAsync(ticket.TicketNo, creatorName, ticket.ServiceId.ToString());
            }
            return MapToGetOutputDto(ticket);
        }

        public async Task ChangeStatusAsync(long ticketId, TicketStatus newStatus, string? comment = null)
        {
            var ticket = await Repository.GetAsync(ticketId);
            if (ticket.Status == newStatus) return;

            var oldStatus = ticket.Status;
            ticket.Status = newStatus;

            if (newStatus == TicketStatus.Resolved || newStatus == TicketStatus.Closed)
                ticket.ResolvedAt = DateTime.Now;

            await Repository.UpdateAsync(ticket);

            // Lưu lịch sử chuyển trạng thái
            var activityDesc = $"Đổi trạng thái từ {oldStatus} sang {newStatus}";
            await _ticketActivityRepository.InsertAsync(new TicketActivity(ticketId, "StatusChange", activityDesc, oldStatus.ToString(), newStatus.ToString()));

            if (!string.IsNullOrWhiteSpace(comment))
            {
                await _ticketCommentRepository.InsertAsync(new TicketComment(ticketId, comment, false));
            }

            // GỬI THÔNG BÁO: Đổi trạng thái hoàn tất / đóng
            var notificationService = LazyServiceProvider.LazyGetRequiredService<INotificationAppService>();
            if (notificationService != null && ticket.CreatorId.HasValue)
            {
                if (newStatus == TicketStatus.Resolved || newStatus == TicketStatus.Closed)
                {
                    await notificationService.NotifyTicketResolvedAsync(ticket.CreatorId.Value, ticket.TicketNo, newStatus == TicketStatus.Closed);
                }
            }
        }

        public async Task AddCommentAsync(long ticketId, string content, bool isInternal = false, long? parentId = null)
        {
            var ticket = await Repository.GetAsync(ticketId);
            var comment = new TicketComment(ticketId, content, isInternal) { ParentId = parentId };
            await _ticketCommentRepository.InsertAsync(comment, autoSave: true);

            var activityDesc = isInternal ? "Bình luận nội bộ mới" : "Bình luận trao đổi mới";
            await _ticketActivityRepository.InsertAsync(new TicketActivity(ticketId, "CommentAdded", activityDesc));

            // GỬI THÔNG BÁO CÓ COMMENT MỚI
            var notificationService = LazyServiceProvider.LazyGetRequiredService<INotificationAppService>();
            if (notificationService != null)
            {
                bool isEndUser = CurrentUser.IsInRole("End_User") || CurrentUser.IsInRole("user");
                if (isEndUser && ticket.AssigneeId.HasValue)
                {
                    await notificationService.NotifyNewCommentAsync(ticket.AssigneeId.Value, ticket.TicketNo, CurrentUser.UserName ?? "User", false);
                }
                else if (!isEndUser && ticket.CreatorId.HasValue)
                {
                    await notificationService.NotifyNewCommentAsync(ticket.CreatorId.Value, ticket.TicketNo, CurrentUser.UserName ?? "IT Support", isInternal);
                }
            }
        }

        public async Task AssignTicketAsync(AssignTicketDto input)
        {
            var ticket = await Repository.GetAsync(input.TicketId);
            var oldAssignee = ticket.AssigneeId;
            ticket.AssigneeId = input.AssigneeId;
            ticket.TeamId = input.TeamId;

            if (ticket.Status == TicketStatus.New && (input.AssigneeId.HasValue || input.TeamId.HasValue))
                ticket.Status = TicketStatus.Assigned;

            await Repository.UpdateAsync(ticket);

            var assignMsg = input.AssigneeId.HasValue ? "Đã phân công cho kỹ thuật viên xử lý" : "Đã chuyển cho đội IT";
            await _ticketActivityRepository.InsertAsync(new TicketActivity(input.TicketId, "TicketAssigned", assignMsg, oldAssignee?.ToString(), input.AssigneeId?.ToString()));

            // GỬI THÔNG BÁO CHO KỸ THUẬT VIÊN ĐƯỢC PHÂN CÔNG
            if (input.AssigneeId.HasValue && input.AssigneeId != oldAssignee)
            {
                var notificationService = LazyServiceProvider.LazyGetRequiredService<INotificationAppService>();
                if (notificationService != null)
                {
                    await notificationService.NotifyTicketAssignedAsync(input.AssigneeId.Value, ticket.TicketNo);
                }
            }
        }

        public async Task<List<TicketTimelineDto>> GetTimelineAsync(long ticketId)
        {
            var activities = await _ticketActivityRepository.GetListAsync(x => x.TicketId == ticketId);
            return activities.Select(a => new TicketTimelineDto
            {
                Id = a.Id,
                Type = "Activity",
                Content = a.Description,
                CreationTime = a.CreationTime
            }).ToList();
        }

        public async Task UploadAttachmentAsync(UploadAttachmentDto input)
        {
            var bytes = Convert.FromBase64String(input.Base64Content);
            var blobName = $"{Guid.NewGuid()}_{input.FileName}";
            await _blobContainer.SaveAsync(blobName, bytes);
            var attachment = new TicketAttachment(input.TicketId, input.FileName, blobName, bytes.Length, input.ContentType);
            await _attachmentRepository.InsertAsync(attachment, autoSave: true);
        }

        public async Task<List<UserDto>> GetAssignableTechniciansAsync()
        {
            var users = await _userRepository.GetListAsync(x => x.IsActive);
            return ObjectMapper.Map<List<IdentityUser>, List<UserDto>>(users);
        }

        protected override Ticket MapToEntity(CreateUpdateTicketDto createInput) { return ObjectMapper.Map<CreateUpdateTicketDto, Ticket>(createInput); }
        protected override void MapToEntity(CreateUpdateTicketDto updateInput, Ticket entity) { ObjectMapper.Map(updateInput, entity); }
        protected override TicketDto MapToGetOutputDto(Ticket entity) { return ObjectMapper.Map<Ticket, TicketDto>(entity); }
        protected override TicketDto MapToGetListOutputDto(Ticket entity) { return ObjectMapper.Map<Ticket, TicketDto>(entity); }
    }
}