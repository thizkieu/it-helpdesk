import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '@proxy/tickets';
import { CoreModule } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, ThemeSharedModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private ticketService = inject(TicketService);

  stats: any = {
    totalTickets: 0,
    newTickets: 0,
    unassignedTickets: 0,
    resolvedTickets: 0,
    overdueTickets: 0,
    slaComplianceRate: 100
  };

  isLoading = true;

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.ticketService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats = res || {};
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Lỗi khi tải dữ liệu Dashboard:', err);
        this.isLoading = false;
      }
    });
  }
}