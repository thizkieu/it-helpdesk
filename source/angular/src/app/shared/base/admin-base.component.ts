import { Directive, HostListener, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { ListService } from '@abp/ng.core';

@Directive()
export abstract class AdminBaseComponent implements OnInit, OnDestroy {
  public readonly list = inject(ListService);

  // Biến dùng chung cho tất cả ô input [(ngModel)]="searchFilter" ở các trang con
  searchFilter: string = '';

  search$ = new Subject<string>();
  searchSubscription?: Subscription;

  recentSearches: string[] = [];
  showSearchSuggestions: boolean = false;

  protected abstract storageKey: string;

  @ViewChild(DatatableComponent) table!: DatatableComponent;

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.table) {
      this.table.recalculate();
    }
  }

  ngOnInit(): void {
    this.loadSearchHistory();

    // LÕI TÌM KIẾM CHUNG: Lắng nghe mọi phím gõ, đợi 350ms rồi tự động lọc
    this.searchSubscription = this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(keyword => {
      this.searchFilter = keyword.trim();

      if (this.searchFilter) {
        this.saveSearchHistory(this.searchFilter);
      }

      // Kích hoạt ListService gọi API tải lại bảng ngay lập tức
      this.list.get();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadSearchHistory(): void {
    const savedHistory = localStorage.getItem(this.storageKey);
    if (savedHistory) {
      this.recentSearches = JSON.parse(savedHistory);
    }
  }

  saveSearchHistory(keyword: string): void {
    if (!keyword || !keyword.trim()) return;
    const clean = keyword.trim();
    this.recentSearches = [clean, ...this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  // --- CÁC HÀNH ĐỘNG TÌM KIẾM ĐƯỢC GỌI TỪ HTML ---

  onSearchInput(): void {
    this.showSearchSuggestions = true;
    this.search$.next(this.searchFilter); // Bắn tín hiệu đi ngay từ ký tự đầu tiên
  }

  selectSearchSuggestion(keyword: string): void {
    this.searchFilter = keyword;
    this.showSearchSuggestions = false;
    this.search$.next(keyword);
  }

  performSearch(): void {
    this.showSearchSuggestions = false;
    this.search$.next(this.searchFilter);
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.showSearchSuggestions = false;
    this.search$.next('');
  }

  // --- QUẢN LÝ XÓA LỊCH SỬ DÙNG CHUNG ---
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
}