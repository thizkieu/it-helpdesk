import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  faqList: any[] = [];
  filteredFaqList: any[] = [];
  searchText: string = '';
  isLoading = true;

  // --- BIẾN CHO TÌM KIẾM THÔNG MINH & LỊCH SỬ ---
  private readonly storageKey = 'kb_search_history';
  recentSearches: string[] = [];
  showSearchSuggestions: boolean = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Lắng nghe click toàn màn hình để tự động đóng dropdown lịch sử khi click ra ngoài
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    this.loadSearchHistory();
    this.loadFaqList();

    // LÕI TÌM KIẾM REAL-TIME: Tự động lọc ngay từ chữ cái đầu tiên
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
      { category: 'Mạng', question: 'Cách đổi mật khẩu Wi-Fi nội bộ công ty', answer: 'Truy cập vào trang quản trị mạng nội bộ, chọn mục Wireless Settings và tiến hành nhập mật khẩu mới theo chuẩn bảo mật.' },
      { category: 'Phần cứng', question: 'Khắc phục lỗi máy in không kéo giấy', answer: 'Kiểm tra xem khay chứa giấy có bị lệch không, loại bỏ các tờ giấy bị kẹt bên trong bộ phận cuộn lăn.' },
      { category: 'Bảo mật', question: 'Hướng dẫn kết nối mạng VPN làm việc từ xa', answer: 'Mở phần mềm VPN Client, nhập địa chỉ server công ty và điền tài khoản Active Directory cá nhân để đăng nhập.' }
    ];
    this.filteredFaqList = this.faqList;
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
}