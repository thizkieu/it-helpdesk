using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Uow;
using Volo.Abp.Identity;
using ItHelpdesk.Notifications;
using ItHelpdesk.Tickets;
using ItHelpdesk.SignalR;
using ItHelpdesk.Localization;

namespace ItHelpdesk.Workers
{
    public class SlaTrackingWorker : AsyncPeriodicBackgroundWorkerBase
    {
        public SlaTrackingWorker(
            AbpAsyncTimer timer,
            IServiceScopeFactory serviceScopeFactory) : base(timer, serviceScopeFactory)
        {
            Timer.Period = 5 * 60 * 1000;
        }

        [UnitOfWork]
        protected override async Task DoWorkAsync(PeriodicBackgroundWorkerContext workerContext)
        {
            var ticketRepository = workerContext.ServiceProvider.GetRequiredService<IRepository<Ticket, long>>();
            var notificationRepository = workerContext.ServiceProvider.GetRequiredService<IRepository<AppNotification, Guid>>();
            var hubContext = workerContext.ServiceProvider.GetRequiredService<IHubContext<NotificationHub>>();
            var activityRepository = workerContext.ServiceProvider.GetRequiredService<IRepository<TicketActivity, long>>();
            var userManager = workerContext.ServiceProvider.GetRequiredService<IdentityUserManager>();
            var localizer = workerContext.ServiceProvider.GetRequiredService<IStringLocalizer<ItHelpdeskResource>>();

            var now = DateTime.Now;

            var overdueTickets = await ticketRepository.GetListAsync(x =>
                x.TargetResolutionTime.HasValue &&
                x.TargetResolutionTime.Value < now &&
                x.Status != TicketStatus.Resolved &&
                x.Status != TicketStatus.Closed);

            if (!overdueTickets.Any()) return;

            var admins = await userManager.GetUsersInRoleAsync("admin");

            foreach (var ticket in overdueTickets)
            {
                var activities = await activityRepository.GetListAsync(x => x.TicketId == ticket.Id && x.ActivityType == "SLA_Warning");
                if (activities.Any()) continue;

                // TỐI ƯU LOGIC: Cập nhật cờ IsOverdue vào DB để các bộ lọc sau này lấy đúng dữ liệu
                if (!ticket.IsOverdue)
                {
                    ticket.IsOverdue = true;
                    await ticketRepository.UpdateAsync(ticket);
                }

                var activity = new TicketActivity(
                    ticket.Id,
                    activityType: "SLA_Warning",
                    description: localizer["SlaBreach:ActivityDesc"].Value,
                    oldValue: ticket.Status.ToString(),
                    newValue: ticket.Status.ToString()
                );
                await activityRepository.InsertAsync(activity);

                var ticketUrl = $"/tickets/detail/{ticket.Id}";
                var notifList = new List<AppNotification>();

                if (ticket.AssigneeId.HasValue)
                {
                    var techTitle = localizer["SlaBreach:TechWarningTitle"].Value;
                    var techMsg = localizer["SlaBreach:TechWarningMsg", ticket.TicketNo].Value;

                    notifList.Add(AppNotification.CreateNew(ticket.AssigneeId.Value, techTitle, techMsg, "danger", ticketUrl));

                    await hubContext.Clients.Group($"user_{ticket.AssigneeId.Value}")
                        .SendAsync("ReceiveTicketNotification", techMsg);
                }

                var adminTitle = localizer["SlaBreach:AdminWarningTitle"].Value;
                var adminMsg = localizer["SlaBreach:AdminWarningMsg", ticket.TicketNo].Value;

                foreach (var admin in admins)
                {
                    if (ticket.AssigneeId.HasValue && admin.Id == ticket.AssigneeId.Value) continue;
                    notifList.Add(AppNotification.CreateNew(admin.Id, adminTitle, adminMsg, "warning", ticketUrl));
                }

                await hubContext.Clients.Group("group_admins").SendAsync("ReceiveTicketNotification", adminMsg);

                if (notifList.Any())
                {
                    await notificationRepository.InsertManyAsync(notifList);
                }
            }
        }
    }
}