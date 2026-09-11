import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '@proxy/tickets';
import { CoreModule, LocalizationPipe, LocalizationService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SignalRService } from '../../shared/services/signalr.service';
import { CustomToastService } from '../../shared/services/custom-toast.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, NgxChartsModule, LocalizationPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  private signalRService = inject(SignalRService);
  private customToast = inject(CustomToastService);
  public localizationService = inject(LocalizationService); // Public để dùng ở HTML
  private router = inject(Router);
  
  private destroy$ = new Subject<void>();

  // BỘ LỌC TỔNG KẾT NÂNG CAO
  filterParams = {
    startDate: '',
    endDate: '',
    assigneeId: '',
    status: null as number | null,
    teamId: null as number | null
  };

  technicians: any[] = [];
  teams: any[] = [];

  stats: any = {
    totalTickets: 0,
    newTickets: 0,
    unassignedTickets: 0,
    resolvedTickets: 0,
    overdueTickets: 0,
    slaComplianceRate: 100
  };

  isLoading = true;
  chartView: [number, number] = [650, 320];

  ticketStatusData: any[] = [
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 },
    { name: '', value: 0 }
  ];

  colorScheme: any = {
    domain: ['#38bdf8', '#c084fc', '#34d399', '#f87171']
  };

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadFilterDropdownData();
    this.updateChartLabels();
    this.loadDashboardStats();
    this.signalRService.initRealTimeNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDefaultDates(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.filterParams.startDate = firstDay.toISOString().split('T')[0];
    this.filterParams.endDate = now.toISOString().split('T')[0];
  }

  loadFilterDropdownData(): void {
    this.ticketService.getAssignableTechnicians().subscribe({
      next: (res: any) => { this.technicians = res || []; },
      error: (err: any) => console.error(this.localizationService.instant('ItHelpdesk::Queue:ErrorLoadTechnicians'), err)
    });
  }

  updateChartLabels(): void {
    this.ticketStatusData = [
      { name: this.localizationService.instant('ItHelpdesk::Dashboard:StatusNew'), value: this.stats.newTickets },
      { name: this.localizationService.instant('ItHelpdesk::Dashboard:StatusUnassigned'), value: this.stats.unassignedTickets },
      { name: this.localizationService.instant('ItHelpdesk::Dashboard:StatusResolved'), value: this.stats.resolvedTickets },
      { name: this.localizationService.instant('ItHelpdesk::Dashboard:StatusOverdue'), value: this.stats.overdueTickets }
    ];
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    
    const queryPayload: any = {
      startDate: this.filterParams.startDate ? new Date(this.filterParams.startDate) : undefined,
      endDate: this.filterParams.endDate ? new Date(this.filterParams.endDate + 'T23:59:59') : undefined,
      assigneeId: this.filterParams.assigneeId || undefined,
      status: this.filterParams.status !== null ? this.filterParams.status : undefined,
      teamId: this.filterParams.teamId || undefined
    };

    this.ticketService.getDashboardStats(queryPayload).subscribe({
      next: (res: any) => {
        const data = res || {};
        this.stats = data;
        this.updateChartLabels();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Dashboard:LoadErrorToast'), 'error');
        this.isLoading = false;
      }
    });
  }

  onApplyFilter(): void {
    this.loadDashboardStats();
    this.customToast.show(this.localizationService.instant('ItHelpdesk::Dashboard:FilterApplySuccess'), 'success');
  }

  onResetFilter(): void {
    this.initDefaultDates();
    this.filterParams.assigneeId = '';
    this.filterParams.status = null;
    this.filterParams.teamId = null;
    this.loadDashboardStats();
  }

  navigateToQueue(filterType: string): void {
    const navExtras: any = { queryParams: {} };
    if (filterType === 'unassigned') navExtras.queryParams.unassigned = true;
    else if (filterType === 'overdue') navExtras.queryParams.status = 'overdue';
    else if (filterType === 'new') navExtras.queryParams.status = 0;

    if (this.filterParams.startDate) navExtras.queryParams.startDate = this.filterParams.startDate;
    if (this.filterParams.endDate) navExtras.queryParams.endDate = this.filterParams.endDate;

    this.router.navigate(['/tickets/it-queue'], navExtras);
  }
}