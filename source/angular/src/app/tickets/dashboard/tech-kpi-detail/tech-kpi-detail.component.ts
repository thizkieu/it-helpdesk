import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestService, LocalizationService, LocalizationPipe } from '@abp/ng.core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ToasterService } from '@abp/ng.theme.shared';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-tech-kpi-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxChartsModule, NgbDropdownModule, NgxDatatableModule, LocalizationPipe],
  templateUrl: './tech-kpi-detail.component.html',
  styleUrls: ['./tech-kpi-detail.component.scss']
})
export class TechKpiDetailComponent implements OnInit {
  private route = inject(ActivatedRoute); 
  private router = inject(Router); 
  private restService = inject(RestService);
  public localizationService = inject(LocalizationService);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(ToasterService);
  
  techId: any = null; 
  displayTechId: string = '@TECH-01';
  selectedTech: any = {
    name: '...', email: '', phoneNumber: '', roleName: '', totalAssigned: 0, onTimeRate: 0, overdueRate: 0,
    baseSalary: 12000000, bonusPercent: 0, bonusAmount: 0, penaltyAmount: 0, netSalary: 0
  }; 
  
  managerNote: string = ''; 
  isSavingNote = false;
  techTickets: any[] = []; 
  isLoading = true;
  isFiltered = false;
  
  filterParams = { 
    month: (new Date().getMonth() + 1) as number | null, 
    year: new Date().getFullYear() as number | null 
  };
  months = Array.from({ length: 12 }, (_, i) => i + 1); 
  years: number[] = [];
  
  stats: any = { totalTickets: 0, newTickets: 0, inProgressTickets: 0, resolvedTickets: 0, overdueTickets: 0, slaComplianceRate: 0 };
  
  pageSize = 10;
  pageSizeOptions = [10, 20, 50, 100];
  currentPage = 1; 
  
  get paginatedTickets() { 
    const start = (this.currentPage - 1) * this.pageSize; 
    return this.techTickets.slice(start, start + this.pageSize); 
  }
  
  get totalPages() { return Math.ceil(this.techTickets.length / this.pageSize) || 1; }
  
  ngOnInit(): void {
    this.selectedTech.name = this.localizationService.instant('ItHelpdesk::TechDetail:Loading');
    const cy = new Date().getFullYear(); 
    for (let i = cy - 2; i <= cy + 1; i++) this.years.push(i);
    
    // Nhận tháng và năm từ Dashboard truyền sang
    this.route.queryParams.subscribe(params => {
      if (params['month'] !== undefined) {
        this.filterParams.month = params['month'] ? Number(params['month']) : null;
      }
      if (params['year'] !== undefined) {
        this.filterParams.year = params['year'] ? Number(params['year']) : cy;
      }
    });

    this.route.paramMap.subscribe(params => { 
      this.techId = params.get('id'); 
      if (this.techId) { 
          this.displayTechId = '@' + this.techId.substring(0, 8).toUpperCase();
          this.loadData(); 
      }
    });
  }
  
  loadData(): void {
    this.isLoading = true;
    
    const queryParams: any = {};
    if (this.filterParams.month) queryParams.month = this.filterParams.month;
    if (this.filterParams.year) queryParams.year = this.filterParams.year;
    
    this.restService.request<any, any>({ 
      method: 'GET', 
      url: `/api/app/dashboard/technician-detail/${this.techId}`, 
      params: queryParams 
    }).subscribe({
      next: (res: any) => { 
        const techInfo = res?.technicianInfo || {};
        this.techTickets = res?.tickets || []; 
        
        this.selectedTech = {
            name: techInfo.name || this.localizationService.instant('ItHelpdesk::TechDetail:Unknown'),
            email: techInfo.email || this.localizationService.instant('ItHelpdesk::TechDetail:NotUpdated'),
            phoneNumber: techInfo.phoneNumber || '---',
            roleName: techInfo.roleName || this.localizationService.instant('ItHelpdesk::Dashboard:Technician'),
            totalAssigned: techInfo.totalAssigned || 0,
            onTimeRate: techInfo.onTimeRate || 0,
            overdueRate: techInfo.overdueRate || 0,
            baseSalary: 12000000
        };
        const total = this.selectedTech.totalAssigned;
        const complianceRate = this.selectedTech.onTimeRate;
        const overdueCount = Math.round(total * (this.selectedTech.overdueRate / 100));
        
        this.selectedTech.bonusPercent = complianceRate > 90 ? Math.floor(complianceRate - 90) : 0;
        this.selectedTech.bonusAmount = this.selectedTech.bonusPercent * 100000;
        this.selectedTech.penaltyAmount = overdueCount * 200000;
        this.selectedTech.netSalary = this.selectedTech.baseSalary + this.selectedTech.bonusAmount - this.selectedTech.penaltyAmount;
        
        let newT = 0, inProg = 0, resolvedT = 0, closedT = 0;
        this.techTickets.forEach(t => {
            if (t.status === 0) newT++;
            else if (t.status === 2 || t.status === 3 || t.status === 4) inProg++;
            else if (t.status === 5 || t.status === 6) resolvedT++;
            else if (t.status === 7) closedT++;
        });
        
        this.stats = {
            totalTickets: total,
            newTickets: newT,
            inProgressTickets: inProg,
            resolvedTickets: resolvedT + closedT,
            overdueTickets: overdueCount,
            slaComplianceRate: complianceRate
        };
        
        this.managerNote = ''; 
        this.isLoading = false; 
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }
  
  getStatusName(status: number): string {
    const map: any = {
      0: 'ItHelpdesk::Dashboard:StatusNewOption',
      1: 'ItHelpdesk::Dashboard:StatusInProgressOption',
      2: 'ItHelpdesk::Dashboard:StatusInProgressOption',
      3: 'ItHelpdesk::Dashboard:StatusInProgressOption',
      4: 'ItHelpdesk::Dashboard:StatusInProgressOption',
      5: 'ItHelpdesk::Dashboard:StatusCompletedOption',
      6: 'ItHelpdesk::Dashboard:StatusCompletedOption',
      7: 'ItHelpdesk::Dashboard:StatusClosedOption'
    };
    return this.localizationService.instant(map[status] || 'ItHelpdesk::TechDetail:Unknown');
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 0: return 'status-new';
      case 1: case 2: case 3: case 4: return 'status-inprogress';
      case 5: case 6: return 'status-resolved';
      case 7: return 'status-closed';
      default: return 'status-default';
    }
  }
  
  saveEvaluation(): void {
    if (!this.managerNote || this.managerNote.trim() === '') {
        this.toaster.warn(this.localizationService.instant('ItHelpdesk::TechDetail:ValidateNote'));
        return;
    }
    this.isSavingNote = true;
    setTimeout(() => {
        this.toaster.success(this.localizationService.instant('ItHelpdesk::TechDetail:SaveSuccess'));
        this.isSavingNote = false;
        this.cdr.detectChanges();
    }, 800);
  }

  onApplyFilter(): void { this.isFiltered = true; this.loadData(); }
  onPageSizeChange(): void { this.currentPage = 1; }
  changePage(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; } }
  
  // Khi quay lại dashboard, giữ nguyên tháng và năm đang lọc
  goBack(): void { 
    this.router.navigate(['/tickets/dashboard'], { 
      queryParams: { 
        month: this.filterParams.month, 
        year: this.filterParams.year 
      } 
    }); 
  }
  
  exportTechDetailReport(): void {
    if (!this.techTickets || this.techTickets.length === 0) {
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::TechDetail:ExportNoData'));
      return;
    }
    const exportData = this.techTickets.map((t, index) => ({
      [this.localizationService.instant('ItHelpdesk::Dashboard:ColSTT')]: index + 1,
      [this.localizationService.instant('ItHelpdesk::TechDetail:ColTicketNo')]: t.ticketNo || t.id,
      [this.localizationService.instant('ItHelpdesk::TechDetail:ColTitle')]: t.title,
      [this.localizationService.instant('ItHelpdesk::TechDetail:ColStatus')]: this.getStatusName(t.status),
      [this.localizationService.instant('ItHelpdesk::TechDetail:ColCreationTime')]: t.creationTime,
    }));
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ho_So_KPI_${this.selectedTech.name.replace(/\s+/g, '_')}_Thang_${this.filterParams.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toaster.success(this.localizationService.instant('ItHelpdesk::TechDetail:ExportSuccess'));
  }

  exportAsPDF(): void { window.print(); }
}