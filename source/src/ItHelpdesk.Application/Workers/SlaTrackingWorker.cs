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
            // Thiết lập chu kỳ quét: 5 phút / lần
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

            // 1. Tìm các vé đã quá hạn, chưa hoàn thành/đóng
            var overdueTickets = await ticketRepository.GetListAsync(x =>
                x.TargetResolutionTime.HasValue &&
                x.TargetResolutionTime.Value < now &&
                x.Status != TicketStatus.Resolved &&
                x.Status != TicketStatus.Closed);

            if (!overdueTickets.Any()) return;

            var admins = await userManager.GetUsersInRoleAsync("admin");

            foreach (var ticket in overdueTickets)
            {
                // 2. Kiểm tra xem vé này đã từng bị ghi log cảnh báo quá hạn chưa 
                // (Để tránh việc cứ 5 phút quét một lần lại bắn thông báo spam ngập tràn hệ thống)
                var activities = await activityRepository.GetListAsync(x => x.TicketId == ticket.Id && x.ActivityType == "SLA_Warning");
                if (activities.Any()) continue; // Nếu đã cảnh báo rồi thì bỏ qua, chờ Admin xử lý

                // 3. Chỉ ghi nhận nhật ký hệ thống là "Đã quá hạn SLA" (GIỮ NGUYÊN TRẠNG THÁI HIỆN TẠI CỦA VÉ)
                var activity = new TicketActivity(
                    ticket.Id,
                    activityType: "SLA_Warning",
                    description: $"Hệ thống cảnh báo: Yêu cầu đã vượt quá thời hạn SLA cam kết nhưng chưa được xử lý.",
                    oldValue: ticket.Status.ToString(),
                    newValue: ticket.Status.ToString()
                );
                await activityRepository.InsertAsync(activity);

                var notifList = new List<AppNotification>();

                // 4. Bắn thông báo cho Kỹ thuật viên phụ trách
                if (ticket.AssigneeId.HasValue)
                {
                    var techTitle = localizer["SlaBreach:TechWarningTitle"].Value;
                    var techMsg = string.Format("CẢNH BÁO: Yêu cầu [{0}] đã quá hạn SLA!", ticket.TicketNo);

                    notifList.Add(AppNotification.CreateNew(ticket.AssigneeId.Value, techTitle, techMsg, "danger"));

                    await hubContext.Clients.Group($"user_{ticket.AssigneeId.Value}")
                        .SendAsync("ReceiveTicketNotification", techMsg);
                }

                // 5. Bắn thông báo cho toàn bộ Quản trị viên để nắm tình hình
                var adminTitle = localizer["SlaBreach:AdminWarningTitle"].Value;
                var adminMsg = string.Format("[QUÁ HẠN SLA] Yêu cầu {0} cần được quản trị viên can thiệp!", ticket.TicketNo);

                foreach (var admin in admins)
                {
                    if (ticket.AssigneeId.HasValue && admin.Id == ticket.AssigneeId.Value) continue;

                    notifList.Add(AppNotification.CreateNew(admin.Id, adminTitle, adminMsg, "warning"));
                }

                await hubContext.Clients.Group("group_admins").SendAsync("ReceiveTicketNotification", adminMsg);

                // Lưu danh sách thông báo vào DB
                if (notifList.Any())
                {
                    await notificationRepository.InsertManyAsync(notifList);
                }
            }
        }
    }
}