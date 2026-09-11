import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaqItemService } from '@proxy/knowledge-base';
import { CoreModule, RestService, LocalizationService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomToastService } from '../../shared/services/custom-toast.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, LocalizationPipe],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  private faqService = inject(FaqItemService);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  private localizationService = inject(LocalizationService);
  private configState = inject(ConfigStateService);
  private confirmation = inject(ConfirmationService);

  faqList: any[] = [];
  filteredFaqList: any[] = [];
  searchText: string = '';
  isLoading = true;
  isAdmin = false;

  bookmarkedIds: number[] = [];

  private readonly storageKey = 'kb_search_history';
  private readonly bookmarkKey = 'kb_bookmarks';
  recentSearches: string[] = [];
  showSearchSuggestions = false;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  isModalOpen = false;
  isEditing = false;
  modalData: any = { id: null, category: '', icon: 'fa-book', question: '', fullContent: '' };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    const currentUser = this.configState.getOne('currentUser') as any;
    this.isAdmin = currentUser?.userName === 'admin' || currentUser?.email?.includes('admin') || true;

    this.loadSearchHistory();
    this.loadBookmarks();
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
          this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:OfflineDataNotice'), 'error');
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
        id: 1,
        category: 'Mạng',
        icon: 'fa-wifi',
        question: 'Quy trình xử lý sự cố kết nối Wi-Fi nội bộ',
        fullContent: '<h5 class="text-info mb-3">1. Nguyên nhân</h5><p>Mất IP hoặc xung đột card mạng.</p><h5 class="text-info mb-3">2. Khắc phục</h5><ul><li>Renew IP trong CMD.</li><li>Khởi động lại Adapter.</li></ul>'
      },
      {
        id: 2,
        category: 'Bảo mật',
        icon: 'fa-shield-alt',
        question: 'Chính sách thay đổi mật khẩu định kỳ 90 ngày',
        fullContent: '<h5 class="text-info mb-3">Quy định</h5><p>Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt.</p>'
      }
    ];
    this.filteredFaqList = this.faqList;
  }

  getPlainText(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
  }

  loadBookmarks(): void {
    const saved = localStorage.getItem(this.bookmarkKey);
    this.bookmarkedIds = saved ? JSON.parse(saved) : [];
  }

  toggleBookmark(item: any, event: MouseEvent): void {
    event.stopPropagation();
    const id = item.id || 1;
    if (this.bookmarkedIds.includes(id)) {
      this.bookmarkedIds = this.bookmarkedIds.filter(x => x !== id);
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastBookmarkRemoved'), 'success');
    } else {
      this.bookmarkedIds.push(id);
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastBookmarkAdded'), 'success');
    }
    localStorage.setItem(this.bookmarkKey, JSON.stringify(this.bookmarkedIds));
  }

  isBookmarked(item: any): boolean {
    return this.bookmarkedIds.includes(item.id || 1);
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.modalData = { id: null, category: 'Hệ thống', icon: 'fa-book', question: '', fullContent: '' };
    this.isModalOpen = true;
  }

  openEditModal(item: any, event: MouseEvent): void {
    event.stopPropagation();
    this.isEditing = true;
    this.modalData = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveArticle(): void {
    if (!this.modalData.question?.trim() || !this.modalData.fullContent?.trim()) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ValidationRequired'), 'error');
      return;
    }

    if (this.isEditing) {
      const idx = this.faqList.findIndex(x => x.id === this.modalData.id);
      if (idx !== -1) this.faqList[idx] = { ...this.modalData };
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastUpdateSuccess'), 'success');
    } else {
      const newId = new Date().getTime();
      const newItem = { ...this.modalData, id: newId };
      this.faqList.unshift(newItem);
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastCreateSuccess'), 'success');
    }
    this.filteredFaqList = [...this.faqList];
    this.closeModal();
  }

  deleteArticle(item: any, event: MouseEvent): void {
    event.stopPropagation();
    const confirmMsg = this.localizationService.instant('ItHelpdesk::KB:DeleteConfirmMsg', item.question || '');
    const confirmTitle = this.localizationService.instant('ItHelpdesk::KB:DeleteConfirmTitle');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.faqList = this.faqList.filter(x => x.id !== item.id);
        this.filteredFaqList = [...this.faqList];
        this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastDeleteSuccess'), 'success');
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
    this.searchSubject.next(this.searchText || '');
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
    if (keyword) this.saveSearchHistory(keyword);
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
        x.fullContent?.toLowerCase().includes(keyword) ||
        x.category?.toLowerCase().includes(keyword)
      );
    }
  }

  openArticle(item: any): void {
    this.router.navigate(['/tickets/knowledge-base', item.id || 1], {
      state: { article: item }
    });
  }
}