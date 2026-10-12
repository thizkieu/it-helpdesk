import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  public localizationService = inject(LocalizationService);
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
  langTab: string = 'vi';
  
  modalData: any = { 
    id: null, 
    category: '', 
    icon: 'fa-book', 
    question_Vi: '', 
    question_En: '', 
    answer_Vi: '', 
    answer_En: '' 
  };

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) {
      this.showSearchSuggestions = false;
    }
  }

  ngOnInit(): void {
    const currentUser = this.configState.getOne('currentUser') as any;
    this.isAdmin = currentUser?.roles?.some((r: string) => r.toLowerCase() === 'admin') || false;
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
          this.filteredFaqList = this.faqList;
          this.isLoading = false;
        }
      });
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
    this.langTab = 'vi';
    this.modalData = {
      id: null,
      category: this.localizationService.instant('ItHelpdesk::KB:DefaultCategorySystem'),
      icon: 'fa-book',
      question_Vi: '',
      question_En: '',
      answer_Vi: '',
      answer_En: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(item: any, event: MouseEvent): void {
    event.stopPropagation();
    this.isEditing = true;
    this.langTab = 'vi';
    this.modalData = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveArticle(): void {
    if (!this.modalData.question_Vi?.trim() || !this.modalData.answer_Vi?.trim()) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ValidationRequired'), 'error');
      return;
    }
    const request$ = this.isEditing
      ? this.restService.request({ method: 'PUT', url: `/api/app/faq-item/${this.modalData.id}`, body: this.modalData })
      : this.restService.request({ method: 'POST', url: '/api/app/faq-item', body: this.modalData });

    request$.subscribe({
      next: () => {
        const msgKey = this.isEditing ? 'ItHelpdesk::KB:ToastUpdateSuccess' : 'ItHelpdesk::KB:ToastCreateSuccess';
        this.customToast.show(this.localizationService.instant(msgKey), 'success');
        this.closeModal();
        this.loadFaqList();
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastSaveError'), 'error');
      }
    });
  }

  deleteArticle(item: any, event: MouseEvent): void {
    event.stopPropagation();
    const confirmMsg = this.localizationService.instant('ItHelpdesk::KB:DeleteConfirmMsg', item.question || '');
    const confirmTitle = this.localizationService.instant('ItHelpdesk::KB:DeleteConfirmTitle');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.restService.request({ method: 'DELETE', url: `/api/app/faq-item/${item.id}` }).subscribe(() => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::KB:ToastDeleteSuccess'), 'success');
          this.loadFaqList();
        });
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
        x.answer?.toLowerCase().includes(keyword) ||
        x.category?.toLowerCase().includes(keyword)
      );
    }
  }

  openArticle(item: any): void {
    this.router.navigate(['/tickets/knowledge-base', item.id || 1], {
      state: { article: item }
    });
  }

  goBack(): void {
    if (this.isAdmin) {
      this.router.navigate(['/tickets/it-queue']);
    } else {
      this.router.navigate(['/tickets/my-tickets']);
    }
  }
}