import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CoreModule, LocalizationPipe, LocalizationService, RestService } from '@abp/ng.core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ToasterService } from '@abp/ng.theme.shared';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, NgxChartsModule, LocalizationPipe, NgbDropdownModule, NgxDatatableModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  public localizationService = inject(LocalizationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private restService = inject(RestService);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(ToasterService);
  
  isLoading = true;
  isLoadingCalc = false;
  isSlaExpanded = false;
  isFiltered = false;
  
  filterParams = { startDate: '', endDate: '', assigneeId: null as string | null, status: null as number | null };
  kpiFilter = { month: (new Date().getMonth() + 1) as number | null, year: new Date().getFullYear() as number | null };
  
  months = Array.from({ length: 12 }, (_, i) => i + 1);
  years: number[] = [];
  technicians: any[] = [];
  technicianKPIs: any[] = [];
  stats: any = { totalTickets: 0, newTickets: 0, unassignedTickets: 0, resolvedTickets: 0, overdueTickets: 0, slaComplianceRate: 0, smartInsights: [] };
  
  ticketStatusData: any[] = [];
  slaGaugeData: any[] = [];
  colorSchemeSla: any = { domain: ['#10b981'] };
  gaugeValueFormatting = (value: any) => `${value}%`;
  slaExplanationData: any = null;
  
  pageSize = 10; 
  pageSizeOptions = [5, 10, 20, 50]; 

  // GIẢI PHÁP TỐI THƯỢNG: Hàm tự động ánh xạ màu sắc chuẩn theo tên trạng thái
  getCustomChartColor = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('quá hạn') || lowerName.includes('overdue')) return '#ef4444'; // Đỏ (Quá hạn)
    if (lowerName.includes('hoàn thành') || lowerName.includes('xong') || lowerName.includes('resolved')) return '#10b981'; // Xanh lá
    if (lowerName.includes('đang xử lý') || lowerName.includes('phản hồi') || lowerName.includes('đúng hạn')) return '#0ea5e9'; // Xanh dương
    if (lowerName.includes('đóng') || lowerName.includes('hủy') || lowerName.includes('closed')) return '#94a3b8'; // Xám
    if (lowerName.includes('mới') || lowerName.includes('phân công') || lowerName.includes('new')) return '#f59e0b'; // Cam
    return '#c084fc'; // Màu mặc định (Tím)
  }
  
  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 1; i++) this.years.push(i);
    
    this.route.queryParams.subscribe(params => {
      if (params['month'] !== undefined) {
        this.kpiFilter.month = params['month'] ? Number(params['month']) : null;
      }
      if (params['year'] !== undefined) {
        this.kpiFilter.year = params['year'] ? Number(params['year']) : currentYear;
      }
    });

    this.initDefaultDates(); 
    this.loadFilterDropdownData(); 
    this.loadDashboardStats(); 
    this.loadTechnicianKPIs();
  }
  
  private initDefaultDates(): void {
    const now = new Date(); const pastDate = new Date(); pastDate.setDate(now.getDate() - 30);
    this.filterParams.startDate = pastDate.toISOString().split('T')[0];
    this.filterParams.endDate = now.toISOString().split('T')[0];
  }
  
  selectDateRange(range: 'today' | '7days' | '30days'): void {
    const end = new Date(); const start = new Date();
    if (range === '7days') start.setDate(end.getDate() - 7);
    else if (range === '30days') start.setDate(end.getDate() - 30);
    this.filterParams.endDate = end.toISOString().split('T')[0];
    this.filterParams.startDate = start.toISOString().split('T')[0];
    this.onApplyFilter(); 
  }
  
  loadFilterDropdownData(): void {
    this.restService.request<any, any[]>({ method: 'GET', url: '/api/app/ticket/assignable-technicians' }).subscribe({
      next: (res) => { this.technicians = (res || []).map(t => ({ id: t.id, fullName: `${t.surname || ''} ${t.name || ''}`.trim() || t.userName })); }
    });
  }
  
  loadDashboardStats(): void {
    this.isLoading = true;
    const queryParams: any = { ...this.filterParams };
    if (queryParams.endDate) queryParams.endDate = `${queryParams.endDate}T23:59:59`;
    
    this.restService.request<any, any>({ method: 'GET', url: '/api/app/dashboard/statistics', params: queryParams }).subscribe({
      next: (res: any) => {
        this.stats = res || {}; 
        const totalStatusItems = (res?.statusDistribution || []).reduce((sum: number, item: any) => sum + item.value, 0);
        this.ticketStatusData = (res?.statusDistribution || []).map((item: any) => {
           const percent = totalStatusItems > 0 ? Math.round((item.value / totalStatusItems) * 100) : 0;
           return { name: `${item.name} (${percent}%)`, value: item.value };
        });
        this.slaGaugeData = [{ name: 'SLA', value: this.stats.slaComplianceRate || 0 }];
        this.colorSchemeSla = { domain: [this.stats.slaComplianceRate >= 95 ? '#10b981' : (this.stats.slaComplianceRate >= 80 ? '#f59e0b' : '#ef4444')] };
        this.isLoading = false; 
        this.fetchSlaExplanation(); 
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.toaster.error(this.localizationService.instant('ItHelpdesk::Dashboard:LoadErrorToast')); }
    });
  }
  
  toggleSlaExplanation(): void { this.isSlaExpanded = !this.isSlaExpanded; }
  
  private fetchSlaExplanation(): void {
    this.isLoadingCalc = true;
    const queryParams: any = { ...this.filterParams };
    if (queryParams.endDate) queryParams.endDate = `${queryParams.endDate}T23:59:59`;
    this.restService.request<any, any>({ method: 'GET', url: '/api/app/ticket/sla-gauge-explanation', params: queryParams }).subscribe({
      next: (res: any) => { this.slaExplanationData = res; this.isLoadingCalc = false; this.cdr.detectChanges(); },
      error: () => { this.isLoadingCalc = false; }
    });
  }
  
  loadTechnicianKPIs(): void {
    this.restService.request<any, any[]>({ method: 'GET', url: '/api/app/dashboard/technician-kpi', params: { month: this.kpiFilter.month, year: this.kpiFilter.year, ...this.filterParams } }).subscribe({
      next: (res: any[]) => { this.technicianKPIs = res || []; this.cdr.detectChanges(); },
      error: () => { this.toaster.error(this.localizationService.instant('ItHelpdesk::Dashboard:KpiLoadError')); }
    });
  }
  
  onApplyFilter(): void { this.isFiltered = true; this.loadDashboardStats(); this.loadTechnicianKPIs(); this.toaster.info(this.localizationService.instant('ItHelpdesk::Dashboard:FilterApplySuccess')); }
  onResetFilter(): void { this.isFiltered = false; this.initDefaultDates(); this.filterParams.assigneeId = null; this.filterParams.status = null; this.loadDashboardStats(); this.loadTechnicianKPIs(); }
  onKpiFilterChange(): void { this.loadTechnicianKPIs(); }
  
  navigateToQueue(status: string): void { const queryParams = status === 'unassigned' ? { unassigned: true } : (status !== 'all' ? { status } : {}); this.router.navigate(['/tickets/it-queue'], { queryParams }); }
  
  navigateToTechDetail(techId: string): void { 
    this.router.navigate([`/tickets/dashboard/tech-detail/${techId}`], { 
      queryParams: { returnUrl: this.router.url, month: this.kpiFilter.month, year: this.kpiFilter.year } 
    }); 
  }
  
  exportAsExcel(): void {
    if (!this.technicianKPIs || this.technicianKPIs.length === 0) {
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::Dashboard:ExportNoData'));
      return;
    }
    const exportData = this.technicianKPIs.map((item, index) => ({
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColSTT')]: index + 1,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColFullName')]: item.name,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColRole')]: item.roleName,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColTotalAssigned')]: item.totalAssigned,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColOnTimeRate')]: item.onTimeRate,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColOverdueRate')]: item.overdueRate,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColBonus')]: item.bonusAmount,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColPenalty')]: item.penaltyAmount,
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColNetSalary')]: item.netSalary
    }));
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const reportPrefix = this.localizationService.instant('ItHelpdesk::Dashboard:ReportPrefix');
    const allLabel = this.localizationService.instant('ItHelpdesk::Dashboard:AllYearSimple');
    link.setAttribute('download', `${reportPrefix}_${this.kpiFilter.month || allLabel}_${this.kpiFilter.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toaster.success(this.localizationService.instant('ItHelpdesk::Dashboard:ExportSuccess'));
  }
  exportAsPDF(): void { window.print(); }
  getChartInsight(): string {
    if (this.stats.totalTickets === 0) return this.localizationService.instant('ItHelpdesk::Dashboard:Insight:NoData');
    const newTickets = this.stats.newTickets || 0; const resolvedTickets = this.stats.resolvedTickets || 0;
    const unassignedTickets = this.stats.unassignedTickets || 0; const overdueTickets = this.stats.overdueTickets || 0;
    let insight = '';
    
    if (resolvedTickets >= newTickets && resolvedTickets > 0) { 
        insight += `<strong><span class="text-success"><i class="fas fa-arrow-trend-up me-1"></i> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:PositiveTitle')}</span></strong> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:PositiveDesc')} `; 
    }
    else if (newTickets > resolvedTickets * 1.5 && resolvedTickets > 0) { 
        insight += `<strong><span class="text-warning"><i class="fas fa-arrow-trend-down me-1"></i> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:RiskTitle')}</span></strong> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:RiskDesc')} `; 
    }
    else { 
        insight += `<strong><span class="text-info"><i class="fas fa-balance-scale me-1"></i> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:StableTitle')}</span></strong> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:StableDesc')} `; 
    }
    
    let warnings = [];
    if (unassignedTickets > 0) warnings.push(`<span class="text-warning fw-bold">${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:UnassignedCount', unassignedTickets.toString())}</span>`);
    if (overdueTickets > 0) warnings.push(`<span class="text-danger fw-bold">${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:OverdueCount', overdueTickets.toString())}</span>`);
    
    if (warnings.length > 0) { 
        const joiner = ` ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:And')} `;
        insight += `<div class="mt-2 p-2 rounded" style="background: rgba(0,0,0,0.2); border: 1px dashed rgba(239, 68, 68, 0.4);"><i class="fas fa-exclamation-triangle text-danger me-1"></i> <strong>${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:InterventionTitle')}</strong> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:InterventionDesc', warnings.join(joiner))}</div>`; 
    }
    else { 
        insight += `<div class="mt-2 p-2 rounded" style="background: rgba(0,0,0,0.2); border: 1px dashed rgba(16, 185, 129, 0.4);"><i class="fas fa-check-circle text-success me-1"></i> <strong>${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:SuggestionTitle')}</strong> ${this.localizationService.instant('ItHelpdesk::Dashboard:Insight:SuggestionDesc')}</div>`; 
    }
    return insight;
  }
  getSlaInsight(): string {
    if (this.stats.totalTickets === 0) return this.localizationService.instant('ItHelpdesk::Dashboard:SlaNotApplicable');
    if (this.stats.slaComplianceRate >= 95) return this.localizationService.instant('ItHelpdesk::Dashboard:Insight:SlaExcellent', this.stats.slaComplianceRate.toString());
    if (this.stats.slaComplianceRate >= 80) return this.localizationService.instant('ItHelpdesk::Dashboard:Insight:SlaGood', this.stats.slaComplianceRate.toString());
    return this.localizationService.instant('ItHelpdesk::Dashboard:Insight:SlaWarning', this.stats.slaComplianceRate.toString());
  }
  getSlaStatusClass(): string {
    if (this.stats.slaComplianceRate >= 95) return 'text-success';
    if (this.stats.slaComplianceRate >= 80) return 'text-warning';
    return 'text-danger';
  }
}