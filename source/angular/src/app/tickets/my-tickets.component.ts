import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto, CoreModule, LocalizationPipe, LocalizationService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { TicketService, TicketDto } from '@proxy/tickets';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CustomToastService } from '../shared/services/custom-toast.service'; 

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CoreModule, ThemeSharedModule, NgxDatatableModule, LocalizationPipe],
  providers: [ListService],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss']
})
export class MyTicketsComponent implements OnInit, OnDestroy {
  readonly list = inject(ListService);
  private ticketService = inject(TicketService);
  private elementRef = inject(ElementRef);
  private localizationService = inject(LocalizationService);
  private customToast = inject(CustomToastService);

  data: PagedResultDto<TicketDto> = { items: [], totalCount: 0 };

  filters = {
    filterText: '',
    status: null as number | null,
    skipCount: 0,
    maxResultCount: 10,
    isMyTickets: true,
    isOverdue: false
  };

  private readonly storageKey = 'my_tickets_search_history';
  
  // [SỬA LỖI 2571]: Khai báo mảng kiểu string tường minh
  recentSearches: string[] = []; 
  showSearchSuggestions = false;
  showStatusDropdown = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Sử dụng khóa ngôn ngữ thay vì text cứng
  userFriendlyStatuses = [
    { value: null, label: 'ItHelpdesk::MyTickets:AllStatus' },
    { value: 0, label: 'ItHelpdesk::Enum:TicketStatus.0' },
    { value: 1, label: 'ItHelpdesk::Enum:TicketStatus.1' },
    { value: 2, label: 'ItHelpdesk::Enum:TicketStatus.2' },
    { value: 6, label: 'ItHelpdesk::Enum:TicketStatus.6' },
    { value: 7, label: 'ItHelpdesk::Enum:TicketStatus.7' }
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
    if (!this.elementRef.nativeElement.querySelector('.status-dropdown-wrapper')?.contains(event.target)) {
      this.showStatusDropdown = false;
    }
  }

  ngOnInit(): void {
    this.loadSearchHistory();

    const streamCreator = (query: any) => {
      query.filter = this.filters.filterText?.trim() || '';
      
      if (this.filters.status !== null) {
        query.status = this.filters.status;
      } else {
        delete query.status;
      }

      query.skipCount = this.filters.skipCount;
      query.maxResultCount = this.filters.maxResultCount;
      query.isMyTickets = this.filters.isMyTickets;
      query.isOverdue = this.filters.isOverdue;

      return this.ticketService.getList(query);
    };

    this.list.hookToQuery(streamCreator).subscribe({
      next: (res: PagedResultDto<TicketDto>) => {
        this.data = res;
      },
      // [SỬA LỖI 2571]: Định nghĩa rõ err là type any
      error: (err: any) => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        console.error(err);
      }
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((keyword: string) => {
      const cleanKeyword = keyword.trim();
      if (cleanKeyword) {
        this.saveSearchHistory(cleanKeyword);
      }
      this.filters.skipCount = 0;
      this.list.get();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onPageChange(event: any): void {
    const newSkipCount = event.offset * this.filters.maxResultCount;
    if (this.filters.skipCount !== newSkipCount) {
      this.filters.skipCount = newSkipCount;
      this.list.get();
    }
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem(this.storageKey);
    // [SỬA LỖI 2571]: Ép kiểu an toàn từ JSON.parse
    this.recentSearches = saved ? (JSON.parse(saved) as string[]) : [];
  }

  private saveSearchHistory(keyword: string): void {
    if (!keyword || !keyword.trim()) return;
    const clean = keyword.trim();
    // [SỬA LỖI 2571]: Ép kiểu an toàn khi thao tác mảng
    const filtered = this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase());
    this.recentSearches = [clean, ...filtered].slice(0, 5);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  removeSearchHistoryItem(item: string, event: MouseEvent): void {
    event.stopPropagation();
    this.recentSearches = this.recentSearches.filter(x => x !== item);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  clearAllSearchHistory(event: MouseEvent): void {
    event.stopPropagation();
    this.recentSearches = [];
    localStorage.removeItem(this.storageKey);
  }

  onSearchInput(): void {
    this.showSearchSuggestions = true;
    this.searchSubject.next(this.filters.filterText || '');
  }

  selectSearchSuggestion(keyword: string): void {
    this.filters.filterText = keyword;
    this.showSearchSuggestions = false;
    this.saveSearchHistory(keyword);
    this.filters.skipCount = 0;
    this.list.get();
  }

  performSearch(): void {
    const keyword = this.filters.filterText?.trim();
    this.showSearchSuggestions = false;
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.filters.skipCount = 0;
    this.list.get();
  }

  clearSearch(): void {
    this.filters.filterText = '';
    this.showSearchSuggestions = false;
    this.filters.skipCount = 0;
    this.list.get();
  }

  onFilterChange(): void {
    this.filters.skipCount = 0;
    this.list.get();
  }

  onOverdueToggle(): void {
    this.filters.skipCount = 0;
    this.list.get();
  }

  selectStatus(status: number | null): void {
    this.filters.status = status;
    this.showStatusDropdown = false;
    this.onFilterChange();
  }

  // HÀM ÁNH XẠ TRẠNG THÁI (ĐA NGÔN NGỮ)
  getStatusLabel(status: number | null): string {
    const found = this.userFriendlyStatuses.find(s => s.value === status);
    if (found) {
      return this.localizationService.instant(found.label);
    }
    // Gộp trạng thái Đang xử lý
    if (status === 3 || status === 4 || status === 5) {
      return this.localizationService.instant('ItHelpdesk::Enum:TicketStatus.2');
    }
    return this.localizationService.instant('ItHelpdesk::MyTickets:AllStatus');
  }
}