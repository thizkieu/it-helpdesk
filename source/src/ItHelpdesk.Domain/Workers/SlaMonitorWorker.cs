using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.Threading;
using Volo.Abp.Domain.Repositories;
using System.Linq;
using ItHelpdesk.Tickets;

namespace ItHelpdesk.Workers
{
    public class SlaMonitorWorker : AsyncPeriodicBackgroundWorkerBase
    {
        public SlaMonitorWorker(AbpAsyncTimer timer, IServiceScopeFactory serviceScopeFactory)
            : base(timer, serviceScopeFactory)
        {
            Timer.Period = 600000; // 10 phút quét 1 lần
        }

        protected override async Task DoWorkAsync(PeriodicBackgroundWorkerContext workerContext)
        {
            var ticketRepository = workerContext.ServiceProvider.GetRequiredService<IRepository<Ticket, long>>();
            var now = DateTime.Now;

            // Tìm các Ticket chưa xử lý xong, có DueDate, đã quá hạn thời gian thực tế và chưa được cắm cờ
            var overdueTickets = await ticketRepository.GetListAsync(t =>
                t.Status != TicketStatus.Resolved &&
                t.Status != TicketStatus.Closed &&
                t.DueDate != null &&
                t.DueDate < now &&
                t.IsOverdue == false);

            if (overdueTickets.Any())
            {
                foreach (var ticket in overdueTickets)
                {
                    ticket.IsOverdue = true;
                }

                await ticketRepository.UpdateManyAsync(overdueTickets);
            }
        }
    }
}