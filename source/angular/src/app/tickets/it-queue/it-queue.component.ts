import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { CoreModule, ListService, PagedResultDto, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CustomToastService } from '../../shared/services/custom-toast.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-it-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, NgxDatatableModule],
  templateUrl: './it-queue.component.html',
  styleUrls: ['./it-queue.component.scss'],
  providers: [ListService]
})
export class ItQueueComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  public readonly list = inject(ListService);
  private customToast = inject(CustomToastService);
  private config = inject(ConfigStateService);
  private elementRef = inject(ElementRef);

  items: TicketDto[] = [];
  totalCount = 0;

  currentTab: 'all' | 'unassigned' | 'mine' | 'pending' = 'all';
  searchFilter: string = '';
  currentUserId: string = '';

  // --- BIẾN CHO TÌM KIẾM THÔNG MINH & LỊCH SỬ ---
  private readonly storageKey = 'it_queue_search_history';
  recentSearches: string[] = [];
  showSearchSuggestions: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  greetingMessage: string = '';
  isLoading: boolean = true; 

  // Đóng gợi ý tìm kiếm khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    const currentUser = this.config.getOne('currentUser');
    this.currentUserId = currentUser?.id || '';
    
    this.loadSearchHistory();
    this.setGreeting();

    const ticketStreamCreator = (query: any) => {
      query.filter = this.searchFilter?.trim() || '';
      if (this.currentTab === 'unassigned') query.unassigned = true;
      if (this.currentTab === 'mine') query.assigneeId = this.currentUserId;
      if (this.currentTab === 'pending') query.status = 1; 

      return this.ticketService.getList(query);
    };

    this.list.hookToQuery(ticketStreamCreator).subscribe({
      next: (response: PagedResultDto<TicketDto>) => {
        this.items = response.items || [];
        this.totalCount = response.totalCount || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.customToast.show('Không thể tải dữ liệu hàng đợi!', 'error');
        this.isLoading = false;
        console.error(err);
      }
    });

    // Tự động tìm kiếm sau khi ngừng gõ 350ms
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(keyword => {
      if (keyword.trim().length >= 2) {
        this.saveSearchHistory(keyword.trim());
      }
      this.isLoading = true;
      this.list.get();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  // --- XỬ LÝ LỊCH SỬ TÌM KIẾM ---
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
    this.searchSubject.next(this.searchFilter);
  }

  selectSearchSuggestion(keyword: string): void {
    this.searchFilter = keyword;
    this.showSearchSuggestions = false;
    this.saveSearchHistory(keyword);
    this.isLoading = true;
    this.list.get();
  }

  performSearch(): void {
    const keyword = this.searchFilter?.trim();
    this.showSearchSuggestions = false;
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.isLoading = true;
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.showSearchSuggestions = false;
    this.isLoading = true;
    this.list.get();
  }

  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greetingMessage = '☕ Chào buổi sáng, chúc một ngày năng suất!';
    } else if (hour < 18) {
      this.greetingMessage = '🌤️ Chào buổi chiều, tiến độ tới đâu rồi?';
    } else {
      this.greetingMessage = '🌙 Đã tối rồi, xử lý nốt rồi nghỉ ngơi nhé!';
    }
  }

  changeTab(tab: 'all' | 'unassigned' | 'mine' | 'pending'): void {
    this.currentTab = tab;
    this.isLoading = true;
    this.list.get();
  }

  getSlaStatus(dateValue: string | Date): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';
    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);

    if (targetDate < now) return 'overdue';
    else if (diffHours <= 2) return 'warning';
    
    return 'normal';
  }
}