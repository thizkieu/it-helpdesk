import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '@proxy/tickets';
import { CoreModule } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SignalRService } from '../../shared/services/signalr.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, ThemeSharedModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private ticketService = inject(TicketService);
  private signalRService = inject(SignalRService);

  stats: any = {
    totalTickets: 0,
    newTickets: 0,
    unassignedTickets: 0,
    resolvedTickets: 0,
    overdueTickets: 0,
    slaComplianceRate: 100
  };

  isLoading = true;

  ticketStatusData: any[] = [
    { name: 'Mới (New)', value: 0 },
    { name: 'Chưa phân công', value: 0 },
    { name: 'Đã giải quyết', value: 0 },
    { name: 'Quá hạn SLA', value: 0 }
  ];

  colorScheme: any = {
    domain: ['#38bdf8', '#c084fc', '#34d399', '#f87171']
  };

  ngOnInit(): void {
    this.loadDashboardStats();
    this.signalRService.initRealTimeNotifications();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.ticketService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res || {};

        // Đồng bộ dữ liệu thật từ API vào biểu đồ ngx-charts
        this.ticketStatusData = [
          { name: 'Mới (New)', value: res.newTickets || 0 },
          { name: 'Chưa phân công', value: res.unassignedTickets || 0 },
          { name: 'Đã giải quyết', value: res.resolvedTickets || 0 },
          { name: 'Quá hạn SLA', value: res.overdueTickets || 0 }
        ];

        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Lỗi khi tải dữ liệu Dashboard:', err);
        this.isLoading = false;
      }
    });
  }
}