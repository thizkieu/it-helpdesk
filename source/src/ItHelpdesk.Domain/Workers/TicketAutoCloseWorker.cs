using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.Threading;
using Volo.Abp.Domain.Repositories;
using ItHelpdesk.Tickets;

namespace ItHelpdesk.Workers
{
    public class TicketAutoCloseWorker : AsyncPeriodicBackgroundWorkerBase
    {
        public TicketAutoCloseWorker(
            AbpAsyncTimer timer,
            IServiceScopeFactory serviceScopeFactory)
            : base(timer, serviceScopeFactory)
        {
            // Chạy chu kỳ 12 giờ một lần (43.200.000 ms)
            Timer.Period = 43200000;
        }

        protected override async Task DoWorkAsync(PeriodicBackgroundWorkerContext workerContext)
        {
            // SỬ DỤNG LONG thay vì int để khớp với Entity
            var ticketRepository = workerContext.ServiceProvider.GetRequiredService<IRepository<Ticket, long>>();
            var logger = workerContext.ServiceProvider.GetRequiredService<ILogger<TicketAutoCloseWorker>>();

            // Lấy thời điểm cách đây 3 ngày (Thời gian ân hạn)
            var deadline = DateTime.Now.AddDays(-3);

            // Truy vấn các Ticket đang ở trạng thái 5 (Resolved) quá 3 ngày
            var pendingTickets = await ticketRepository.GetListAsync(t =>
                t.Status == TicketStatus.Resolved &&
                t.LastModificationTime != null &&
                t.LastModificationTime.Value <= deadline);

            if (!pendingTickets.Any()) return;

            foreach (var ticket in pendingTickets)
            {
                // Chuyển sang Hoàn thành (6) hoặc Đóng (7) tùy theo quy trình thực tế của bạn
                ticket.Status = TicketStatus.Completed;
                ticket.ResolvedAt = DateTime.Now;

                await ticketRepository.UpdateAsync(ticket, autoSave: true);

                logger.LogInformation($"Hệ thống tự động chốt Đóng Ticket #{ticket.TicketNo} sau 3 ngày ân hạn.");
            }
        }
    }
}