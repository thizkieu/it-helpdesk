import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { TeamService, TeamDto } from '@proxy/teams';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { CoreModule, ListService, PagedResultDto, ConfigStateService, LocalizationService, LocalizationPipe } from '@abp/ng.core';
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
  public readonly list = inject(ListService);
  private customToast = inject(CustomToastService);
  private config = inject(ConfigStateService);
  private elementRef = inject(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public localizationService = inject(LocalizationService); // Đổi thành public để HTML cũng có thể dùng nếu cần

  items: TicketDto[] = [];
  totalCount = 0;

  currentTab: 'all' | 'unassigned' | 'mine' | 'inprogress' | 'overdue' = 'all';
  searchFilter: string = '';
  currentUserId: string = '';

  advancedFilters = {
    priorityId: null as number | null,
    teamId: null as number | null,
    overdueOnly: false
  };

  skipCount: number = 0;
  maxResultCount: number = 10;

  teams: TeamDto[] = [];
  technicians: any[] = [];
  priorities: PriorityDto[] = [];

  isAssignModalOpen: boolean = false;
  selectedTicket: TicketDto | null = null;
  assignForm: any = {
    ticketId: 0,
    assigneeId: undefined,
    teamId: undefined,
    targetResolutionTime: undefined
  };
  isSavingAssign: boolean = false;

  private readonly storageKey = 'it_queue_search_history';
  recentSearches: string[] = [];
  showSearchSuggestions: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  greetingMessage: string = '';
  isLoading: boolean = true;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    const currentUser = this.config.getOne('currentUser') as any;
    this.currentUserId = currentUser?.id || '';

    this.loadSearchHistory();
    this.setGreeting();
    this.loadDropdownData();

    this.route.queryParams.subscribe(params => {
      if (params['tab'] && ['all', 'unassigned', 'mine', 'inprogress', 'overdue'].includes(params['tab'])) {
        this.currentTab = params['tab'];
      }
      if (params['filter']) {
        this.searchFilter = params['filter'];
      }
      if (params['unassigned'] === 'true') {
        this.currentTab = 'unassigned';
      }
      if (params['status'] === 'overdue' || params['tab'] === 'overdue') {
        this.currentTab = 'overdue';
        this.advancedFilters.overdueOnly = true;
      }
    });

    const ticketStreamCreator = (query: any) => {
      query.filter = this.searchFilter?.trim() || '';

      if (this.currentTab === 'unassigned') {
        query.unassigned = true;
      } else if (this.currentTab === 'mine') {
        query.assigneeId = this.currentUserId;
      } else if (this.currentTab === 'inprogress') {
        query.status = 2; 
      }

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
            const isOpen = t.status !== 6 && t.status !== 7;
            return targetTime < now && isOpen;
          });
        }

        this.items = rawItems;
        this.totalCount = (this.currentTab === 'overdue' || this.advancedFilters.overdueOnly)
          ? rawItems.length
          : (response.totalCount || 0);

        this.isLoading = false;
      },
      error: (err: any) => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:ErrorLoadQueue'), 'error');
        this.isLoading = false;
        console.error(err);
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((keyword: string) => {
      if (keyword.trim().length >= 2) {
        this.saveSearchHistory(keyword.trim());
      }
      this.isLoading = true;
      this.skipCount = 0;
      this.updateUrlParams();
      this.list.get();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
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

  private loadDropdownData(): void {
    this.teamService.getList({ maxResultCount: 100 } as any).subscribe((res: any) => {
      this.teams = res.items || [];
    });

    this.priorityService.getList({ maxResultCount: 100 } as any).subscribe((res: any) => {
      this.priorities = res.items || [];
    });

    this.ticketService.getAssignableTechnicians().subscribe({
      next: (res) => { this.technicians = res || []; },
      error: (err) => { 
        console.error(this.localizationService.instant('ItHelpdesk::Queue:ErrorLoadTechnicians'), err); 
      }
    });
  }

  openAssignModal(ticket: TicketDto): void {
    if (ticket.status === 7 || ticket.status === 6) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:ErrorTicketClosed'), 'error');
      return;
    }

    this.selectedTicket = ticket;

    let formattedDate = undefined;
    if (ticket.targetResolutionTime) {
      const d = new Date(ticket.targetResolutionTime);
      formattedDate = d.toISOString().slice(0, 16);
    }

    this.assignForm = {
      ticketId: ticket.id!,
      assigneeId: ticket.assigneeId || undefined,
      teamId: ticket.teamId || undefined,
      targetResolutionTime: formattedDate
    };
    this.isAssignModalOpen = true;
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
    this.selectedTicket = null;
  }

  saveAssignment(): void {
    if (!this.selectedTicket) return;

    this.isSavingAssign = true;
    this.ticketService.assignTicket(this.assignForm).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:AssignSuccess'), 'success');
        this.isSavingAssign = false;
        this.closeAssignModal();
        this.list.get();
      },
      error: (err: any) => {
        const errorObj = err?.error as any;
        this.customToast.show(errorObj?.error?.message || errorObj?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        this.isSavingAssign = false;
      }
    });
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem(this.storageKey);
    this.recentSearches = saved ? JSON.parse(saved) : [];
  }

  private saveSearchHistory(keyword: string): void {
    if (!keyword || !keyword.trim()) return;
    const clean = keyword.trim();
    this.recentSearches = [clean, ...this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  onSearchInput(): void {
    this.showSearchSuggestions = true;
    this.searchSubject.next(this.searchFilter || '');
  }

  performSearch(): void {
    const keyword = this.searchFilter?.trim();
    this.showSearchSuggestions = false;
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.isLoading = true;
    this.skipCount = 0;
    this.updateUrlParams();
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.showSearchSuggestions = false;
    this.isLoading = true;
    this.skipCount = 0;
    this.updateUrlParams();
    this.list.get();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingMorning');
    } else if (hour < 18) {
      this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingAfternoon');
    } else {
      this.greetingMessage = this.localizationService.instant('ItHelpdesk::Queue:GreetingEvening');
    }
  }

  changeTab(tab: 'all' | 'unassigned' | 'mine' | 'inprogress' | 'overdue'): void {
    this.currentTab = tab;
    if (tab === 'overdue') {
      this.advancedFilters.overdueOnly = true;
    } else {
      this.advancedFilters.overdueOnly = false;
    }
    this.isLoading = true;
    this.skipCount = 0;
    this.updateUrlParams();
    this.list.get();
    
    this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:TabChangedSuccess', this.currentTab.toUpperCase()), 'success');
  }

  onAdvancedFilterChange(): void {
    this.isLoading = true;
    this.skipCount = 0;
    this.list.get();
  }

  refreshQueue(): void {
    this.isLoading = true;
    this.list.get();
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
}