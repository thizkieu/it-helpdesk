import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ListService, PagedResultDto, CoreModule, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { TicketService, TicketDto } from '@proxy/tickets';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CoreModule,
    ThemeSharedModule,
    NgxDatatableModule
  ],
  providers: [ListService],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss']
})
export class MyTicketsComponent implements OnInit, OnDestroy {
  readonly list = inject(ListService);
  private ticketService = inject(TicketService);
  private config = inject(ConfigStateService);
  private elementRef = inject(ElementRef);

  data: PagedResultDto<TicketDto> = { items: [], totalCount: 0 };

  filters = {
    filterText: '',
    status: null as number | null
  };

  private readonly storageKey = 'my_tickets_search_history';
  recentSearches: string[] = [];
  showSearchSuggestions = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Lắng nghe click toàn màn hình để tự đóng dropdown khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    this.loadSearchHistory();

    const currentUser = this.config.getOne('currentUser');
    const currentUserId = currentUser?.id || '';

    const streamCreator = (query: any) => {
      query.filter = this.filters.filterText?.trim() || '';
      if (this.filters.status !== null) {
        query.status = this.filters.status;
      }
      query.creatorId = currentUserId; 

      return this.ticketService.getList(query);
    };

    this.list.hookToQuery(streamCreator).subscribe(res => {
      this.data = res;
    });

    // TỰ ĐỘNG TÌM KIẾM MƯỢT MÀ TỪ KÝ TỰ ĐẦU TIÊN
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(keyword => {
      const cleanKeyword = keyword.trim();
      if (cleanKeyword) {
        this.saveSearchHistory(cleanKeyword);
      }
      this.list.get();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // --- QUẢN LÝ LỊCH SỬ TÌM KIẾM ---
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

  // --- CÁC HÀNH ĐỘNG TÌM KIẾM ---
  onSearchInput(): void {
    this.showSearchSuggestions = true;
    this.searchSubject.next(this.filters.filterText);
  }

  selectSearchSuggestion(keyword: string): void {
    this.filters.filterText = keyword;
    this.showSearchSuggestions = false;
    this.saveSearchHistory(keyword);
    this.list.get();
  }

  performSearch(): void {
    const keyword = this.filters.filterText?.trim();
    this.showSearchSuggestions = false;
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.list.get();
  }

  clearSearch(): void {
    this.filters.filterText = '';
    this.showSearchSuggestions = false;
    this.list.get();
  }

  onFilterChange(): void {
    this.list.get();
  }
}