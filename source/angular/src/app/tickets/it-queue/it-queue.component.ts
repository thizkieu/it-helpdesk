import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { TeamService, TeamDto } from '@proxy/teams';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { CoreModule, ListService, PagedResultDto, ConfigStateService, LocalizationService, LocalizationPipe, RestService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CustomToastService } from '../../shared/services/custom-toast.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-it-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, NgxDatatableModule, LocalizationPipe],
  templateUrl: './it-queue.component.html',
  styleUrls: ['./it-queue.component.scss'],
  providers: [ListService]
})
export class ItQueueComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  private teamService = inject(TeamService);
  private priorityService = inject(PriorityService);
  private restService = inject(RestService);
  public readonly list = inject(ListService);
  private customToast = inject(CustomToastService);
  private config = inject(ConfigStateService);
  private elementRef = inject(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public localizationService = inject(LocalizationService);
  
  items: TicketDto[] = [];
  totalCount = 0;
  currentTab: 'all' | 'unassigned' | 'mine' | 'inprogress' | 'overdue' = 'all';
  searchFilter: string = '';
  currentUserId: string = '';
  isAdmin: boolean = false;
  isLoading: boolean = true;
  greetingMessage: string = '';
  
  advancedFilters = {
    priorityId: null as number | null,
    teamId: null as number | null,
    overdueOnly: false
  };
  
  skipCount: number = 0;
  maxResultCount: number = 10;
  teams: TeamDto[] = [];
  filteredTechnicians: any[] = [];
  priorities: PriorityDto[] = [];
  
  showTeamDropdown: boolean = false;
  showPriorityDropdown: boolean = false;
  showSearchSuggestions: boolean = false;
  private readonly storageKey = 'it_queue_search_history';
  recentSearches: string[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // --- Assign Modal States ---
  isAssignModalOpen: boolean = false;
  selectedTicket: TicketDto | null = null;
  isSubmitting: boolean = false;
  isSavingAssign: boolean = false;
  isAssignLoading: boolean = false;
  assignForm: any = { ticketId: 0, assigneeId: undefined, teamId: undefined };

  // --- Cancel Modal States ---
  isForceCloseModalOpen: boolean = false;
  selectedTicketForClose: TicketDto | null = null;
  cancelReason: string = '';
  isSavingCancel: boolean = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
    if (!this.elementRef.nativeElement.querySelector('.team-dropdown-wrapper')?.contains(event.target)) {
      this.showTeamDropdown = false;
    }
    if (!this.elementRef.nativeElement.querySelector('.priority-dropdown-wrapper')?.contains(event.target)) {
      this.showPriorityDropdown = false;
    }
  }

  ngOnInit(): void {
    const currentUser = this.config.getOne('currentUser') as any;
    this.currentUserId = currentUser?.id || '';
    this.isAdmin = currentUser?.roles?.some((r: string) => r.toLowerCase() === 'admin') || false;
    
    this.loadSearchHistory();
    this.setGreeting();
    this.loadDropdownData();
    
    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['all', 'unassigned', 'mine', 'inprogress', 'overdue'].includes(params['tab'])) {
        this.currentTab = params['tab'];
      }
      if (params['filter']) this.searchFilter = params['filter'];
      if (params['unassigned'] === 'true') this.currentTab = 'unassigned';
      if (params['status'] === 'overdue' || params['tab'] === 'overdue') {
        this.currentTab = 'overdue';
        this.advancedFilters.overdueOnly = true;
      }
    });

    const ticketStreamCreator = (query: any) => {
      query.filter = this.searchFilter?.trim() || '';
      if (this.currentTab === 'unassigned') query.unassigned = true;
      else if (this.currentTab === 'mine') query.assigneeId = this.currentUserId;
      else if (this.currentTab === 'inprogress') query.status = 2; 
      if (this.advancedFilters.teamId) query.teamId = this.advancedFilters.teamId;
      if (this.advancedFilters.priorityId) query.priorityId = this.advancedFilters.priorityId;
      query.skipCount = this.skipCount;
      query.maxResultCount = this.maxResultCount;
      return this.ticketService.getList(query);
    };

    this.list.hookToQuery(ticketStreamCreator).subscribe({
      next: (response: PagedResultDto<TicketDto>) => {
        let rawItems = response.items || [];
        const now = new Date().getTime();
        if (this.currentTab === 'overdue' || this.advancedFilters.overdueOnly) {
          rawItems = rawItems.filter((t: any) => {
            if (!t.targetResolutionTime) return false;
            const targetTime = new Date(t.targetResolutionTime).getTime();
            const isOpen = t.status !== 5 && t.status !== 6 && t.status !== 7; 
            return targetTime < now && isOpen;
          });
        }
        this.items = rawItems;
        this.totalCount = (this.currentTab === 'overdue' || this.advancedFilters.overdueOnly) ? rawItems.length : (response.totalCount || 0);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
        this.isLoading = false;
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((keyword: string) => {
      if (keyword.trim().length >= 2) this.saveSearchHistory(keyword.trim());
      this.triggerDataLoad();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  createFollowUp(row: any): void {
    this.router.navigate(['/tickets/create'], { 
      queryParams: { parentId: row.id, parentNo: row.ticketNo } 
    });
  }

  private updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.currentTab, filter: this.searchFilter || null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onPageChange(event: any): void {
    const newSkipCount = event.offset * this.maxResultCount;
    if (this.skipCount !== newSkipCount) {
      this.skipCount = newSkipCount;
      this.list.get();
    }
  }

  private triggerDataLoad() {
    this.isLoading = true;
    this.skipCount = 0;
    this.updateUrlParams();
    this.list.get();
  }

  private loadDropdownData(): void {
    this.teamService.getList({ maxResultCount: 100 } as any).subscribe(res => this.teams = res.items || []);
    this.priorityService.getList({ maxResultCount: 100 } as any).subscribe(res => this.priorities = res.items || []);
  }

  toggleTeamDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showTeamDropdown = !this.showTeamDropdown;
    this.showPriorityDropdown = false;
    this.showSearchSuggestions = false;
  }

  togglePriorityDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showPriorityDropdown = !this.showPriorityDropdown;
    this.showTeamDropdown = false;
    this.showSearchSuggestions = false;
  }

  selectTeamFilter(teamId: number | null): void {
    this.advancedFilters.teamId = teamId;
    this.showTeamDropdown = false;
    this.triggerDataLoad();
  }

  selectPriorityFilter(priorityId: number | null): void {
    this.advancedFilters.priorityId = priorityId;
    this.showPriorityDropdown = false;
    this.triggerDataLoad();
  }

  getTeamName(teamId: number | null): string {
    if (!teamId) return this.localizationService.instant('ItHelpdesk::Queue:FilterTeamDefault');
    return this.teams.find(x => x.id === teamId)?.name || '';
  }

  getPriorityName(priorityId: number | null): string {
    if (!priorityId) return this.localizationService.instant('ItHelpdesk::Queue:FilterPriorityDefault');
    return this.priorities.find(x => x.id === priorityId)?.name || '';
  }

  onSearchInput(): void {
    this.showSearchSuggestions = true;
    this.searchSubject.next(this.searchFilter || '');
  }

  performSearch(keyword?: string): void {
    if (keyword !== undefined) this.searchFilter = keyword;
    const cleanKeyword = this.searchFilter?.trim();
    this.showSearchSuggestions = false;
    if (cleanKeyword) this.saveSearchHistory(cleanKeyword);
    this.triggerDataLoad();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.showSearchSuggestions = false;
    this.triggerDataLoad();
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem(this.storageKey);
    this.recentSearches = saved ? JSON.parse(saved) : [];
  }

  private saveSearchHistory(keyword: string): void {
    if (!keyword.trim()) return;
    const clean = keyword.trim();
    this.recentSearches = [clean, ...this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  changeTab(tab: 'all' | 'unassigned' | 'mine' | 'inprogress' | 'overdue'): void {
    this.currentTab = tab;
    this.advancedFilters.overdueOnly = (tab === 'overdue');
    this.triggerDataLoad();
  }

  refreshQueue(): void {
    this.triggerDataLoad();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingMorning');
    else if (hour < 18) this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingAfternoon');
    else this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingEvening');
  }

  // --- TRẠNG THÁI VÀ GIAO DIỆN BADGE MỚI ---
  getStatusLabel(status: number | undefined): string {
    if (status === undefined) return '';
    return this.localizationService.instant(`ItHelpdesk::Enum:TicketStatus.${status}`);
  }

  getStatusClass(status: number | undefined): string {
    switch (status) {
      case 0: return 'status-new';
      case 1: return 'status-assigned';
      case 2: return 'status-inprogress';
      case 3: return 'status-pending';
      case 4: return 'status-escalated';
      case 5: return 'status-resolved';
      case 6: return 'status-completed';
      case 7: return 'status-closed';
      default: return '';
    }
  }

  getStatusIcon(status: number | undefined): string {
    switch (status) {
      case 0: return 'fa-star';
      case 1: return 'fa-user-check';
      case 2: return 'fa-tools';
      case 3: return 'fa-pause-circle';
      case 4: return 'fa-exclamation-circle';
      case 5: return 'fa-check-double';
      case 6: return 'fa-check-circle';
      case 7: return 'fa-ban';
      default: return 'fa-info-circle';
    }
  }

  getPriorityClass(name: string | undefined): string {
    if (!name) return 'priority-normal';
    const lower = name.toLowerCase();
    if (lower.includes('thấp') || lower.includes('low')) return 'priority-low';
    if (lower.includes('cao') || lower.includes('high')) return 'priority-high';
    if (lower.includes('khẩn') || lower.includes('critical')) return 'priority-critical';
    return 'priority-normal';
  }

  getSlaStatus(dateValue?: string | Date | null): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';
    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);
    if (targetDate < now) return 'overdue';
    else if (diffHours <= 2 && diffHours > 0) return 'warning';
    return 'normal';
  }

  // --- MODALS ---
  openAssignModal(ticket: TicketDto): void {
    if (ticket.status === 7) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:ErrorTicketClosed'), 'error');
      return;
    }
    this.selectedTicket = ticket;
    this.assignForm = {
      ticketId: ticket.id!,
      assigneeId: ticket.assigneeId || undefined,
      teamId: ticket.teamId || undefined
    };
    
    this.filteredTechnicians = [];
    if (this.assignForm.teamId) {
      this.onTeamChange(this.assignForm.teamId, true);
    }
    
    this.isAssignModalOpen = true;
  }

  onTeamChange(teamId: number | undefined, isInit: boolean = false): void {
    if (!isInit) {
      this.assignForm.assigneeId = undefined; 
    }
    if (!teamId) {
      this.filteredTechnicians = [];
      return;
    }
    this.isAssignLoading = true;
    this.restService.request<any, any>({
      method: 'GET',
      url: `/api/app/team/${teamId}/members`
    }).subscribe({
      next: (res: any[]) => {
        this.filteredTechnicians = res || [];
        this.isAssignLoading = false;
      },
      error: (err: any) => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
        this.filteredTechnicians = [];
        this.isAssignLoading = false;
      }
    });
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
    this.selectedTicket = null;
  }

  submitAssign(): void {
    if (!this.selectedTicket) return;
    
    if (!this.assignForm.teamId && this.assignForm.assigneeId) {
       this.customToast.show(this.localizationService.instant('ItHelpdesk::TicketError:TeamRequiredForAssignee'), 'error');
       return;
    }
    this.isSavingAssign = true;
    this.ticketService.assignTicket(this.assignForm).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:AssignSuccess'), 'success');
        this.isSavingAssign = false;
        this.closeAssignModal();
        if (this.list && typeof this.list.get === 'function') {
           this.list.get(); 
        } else {
           window.location.reload();
        }
      },
      error: (err: any) => {
        const errorObj = err?.error?.error || err?.error || err;
        const msg = errorObj?.message || errorObj?.details || this.localizationService.instant('ItHelpdesk::Error:Generic');
        this.customToast.show(msg, 'error');
        this.isSavingAssign = false;
      }
    });
  }

  openForceCloseModal(ticket: TicketDto): void {
    if (!this.isAdmin) return;
    this.selectedTicketForClose = ticket;
    this.cancelReason = '';
    this.isForceCloseModalOpen = true;
  }

  closeForceCloseModal(): void {
    this.isForceCloseModalOpen = false;
    this.selectedTicketForClose = null;
    this.cancelReason = '';
  }

  submitForceClose(): void {
    if (!this.cancelReason || !this.cancelReason.trim()) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:ErrorReasonRequired'), 'error');
      return;
    }
    if (!this.selectedTicketForClose?.id) return;
    
    this.isSavingCancel = true;
    (this.ticketService as any).cancelTicket(this.selectedTicketForClose.id, { reason: this.cancelReason }).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CancelSuccess'), 'success');
        this.isSavingCancel = false;
        this.closeForceCloseModal();
        if (this.list && typeof this.list.get === 'function') {
           this.list.get(); 
        }
      },
      error: (err: any) => {
        const errorObj = err?.error?.error || err?.error || err;
        const msg = errorObj?.message || errorObj?.details || this.localizationService.instant('ItHelpdesk::Error:Generic');
        this.customToast.show(msg, 'error');
        this.isSavingCancel = false;
      }
    });
  }
}