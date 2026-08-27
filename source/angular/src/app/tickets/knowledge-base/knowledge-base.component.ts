import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaqItemService } from '@proxy/knowledge-base';
import { CoreModule, RestService } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomToastService } from '../../shared/services/custom-toast.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  private faqService = inject(FaqItemService);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private elementRef = inject(ElementRef);
  private router = inject(Router); // Inject Router để chuyển trang

  faqList: any[] = [];
  filteredFaqList: any[] = [];
  searchText: string = '';
  isLoading = true;

  private readonly storageKey = 'kb_search_history';
  recentSearches: string[] = [];
  showSearchSuggestions: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    this.loadSearchHistory();
    this.loadFaqList();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(keyword => {
      const cleanKeyword = keyword.trim();
      if (cleanKeyword) {
        this.saveSearchHistory(cleanKeyword);
      }
      this.filterFaq();
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadFaqList(): void {
    this.isLoading = true;

    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/app/faq-item',
    }, { skipHandleError: true })
      .pipe(
        catchError(err => {
          this.customToast.show('Đang sử dụng dữ liệu cẩm nang ngoại tuyến.', 'error');
          return of({ items: [], totalCount: 0 });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.faqList = res?.items || [];
          if (this.faqList.length === 0) {
            this.loadMockData();
          } else {
            this.filteredFaqList = this.faqList;
          }
          this.isLoading = false;
        }
      });
  }

  loadMockData(): void {
    this.faqList = [
      {
        id: 1, // Thêm ID giả lập để chuyển trang không bị lỗi
        category: 'Mạng',
        icon: 'fa-wifi',
        question: 'Cách đổi mật khẩu Wi-Fi nội bộ công ty',
        answer: 'Hướng dẫn kiểm tra card mạng, xin lại cấp phát IP từ DHCP Server và cấu hình DNS khi không thể truy cập mạng nội bộ.',
        fullContent: `
          <h5 class="text-pink mb-3">1. Nguyên nhân phổ biến</h5>
          <p>Lỗi này thường xảy ra do xung đột địa chỉ IP (IP Conflict), card mạng bị treo hoặc thiết bị mất kết nối với máy chủ DHCP.</p>
          <h5 class="text-pink mb-3 mt-4">2. Các bước xử lý chuẩn</h5>
          <ul>
            <li class="mb-2"><strong>Bước 1:</strong> Chuột phải vào biểu tượng mạng ở góc phải, chọn <em>Open Network settings</em>.</li>
            <li class="mb-2"><strong>Bước 2:</strong> Chọn <em>Change adapter options</em>. Chuột phải vào Wi-Fi, chọn <strong>Disable</strong> rồi <strong>Enable</strong> lại.</li>
            <li class="mb-2"><strong>Bước 3:</strong> Mở CMD. Gõ lệnh <code>ipconfig /release</code> rồi <code>ipconfig /renew</code>.</li>
          </ul>
        `
      }
    ];
    this.filteredFaqList = this.faqList;
  }

  getPlainText(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
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
    this.searchSubject.next(this.searchText);
  }

  selectSearchSuggestion(keyword: string): void {
    this.searchText = keyword;
    this.showSearchSuggestions = false;
    this.saveSearchHistory(keyword);
    this.filterFaq();
  }

  performSearch(): void {
    const keyword = this.searchText?.trim();
    this.showSearchSuggestions = false;
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.filterFaq();
  }

  clearSearch(): void {
    this.searchText = '';
    this.showSearchSuggestions = false;
    this.filterFaq();
  }

  filterFaq(): void {
    if (!this.searchText.trim()) {
      this.filteredFaqList = this.faqList;
    } else {
      const keyword = this.searchText.toLowerCase();
      this.filteredFaqList = this.faqList.filter(x =>
        x.question?.toLowerCase().includes(keyword) ||
        x.answer?.toLowerCase().includes(keyword) ||
        x.category?.toLowerCase().includes(keyword)
      );
    }
  }

  // Hàm xử lý click vào card - Chuyển sang trang detail mới
  openArticle(item: any): void {
    // Truyền dữ liệu bài viết sang trang detail thông qua router state
    this.router.navigate(['/tickets/knowledge-base', item.id || 1], {
      state: { article: item }
    });
  }
}