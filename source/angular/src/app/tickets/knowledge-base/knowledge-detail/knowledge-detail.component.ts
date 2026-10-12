import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestService, LocalizationPipe, LocalizationService } from '@abp/ng.core';

// ĐÃ SỬA: Lùi thêm 1 cấp thư mục (../../../) để trỏ đúng vào thư mục shared
import { CustomToastService } from '../../../shared/services/custom-toast.service';

@Component({
  selector: 'app-knowledge-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LocalizationPipe],
  templateUrl: './knowledge-detail.component.html',
  styleUrls: ['./knowledge-detail.component.scss']
})
export class KnowledgeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  public localizationService = inject(LocalizationService);
  
  article: any = null;
  isLoading: boolean = true;
  pages: string[] = [];
  currentPage: number = 0;
  isFocusMode: boolean = false;
  viewCount: number = 142;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchArticleById(id);
    } else {
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state?.['article']) {
        this.article = navigation.extras.state['article'];
        this.processArticlePages();
        this.isLoading = false;
        this.incrementViewCount();
      } else {
        this.isLoading = false;
      }
    }
  }

  fetchArticleById(id: string): void {
    this.isLoading = true;
    this.restService.request<any, any>({
      method: 'GET',
      url: `/api/app/faq-item/${id}`,
    }, { skipHandleError: true })
      .subscribe({
        next: (res: any) => {
          this.article = res;
          this.processArticlePages();
          this.isLoading = false;
          this.incrementViewCount();
        },
        // ĐÃ SỬA: Ép kiểu any cho err để tránh lỗi Type 'unknown'
        error: (err: any) => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::KBDetail:ErrorNotFound'), 'error');
          this.isLoading = false;
        }
      });
  }

  processArticlePages(): void {
    const rawContent = this.article?.answer || this.article?.fullContent || '';
    if (!rawContent) {
      this.pages = [''];
      return;
    }
    this.pages = rawContent.split('<hr class="page-break">');
    this.currentPage = 0;
  }

  incrementViewCount(): void {
    this.viewCount += Math.floor(Math.random() * 3) + 1;
  }

  nextPage(): void {
    if (this.currentPage < this.pages.length - 1) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleFocusMode(): void {
    this.isFocusMode = !this.isFocusMode;
    const msg = this.isFocusMode
      ? this.localizationService.instant('ItHelpdesk::KBDetail:ToastFocusOn')
      : this.localizationService.instant('ItHelpdesk::KBDetail:ToastFocusOff');
    this.customToast.show(msg, 'success');
  }

  shareArticle(): void {
    const url = window.location.href;
    const title = this.article?.question || this.localizationService.instant('ItHelpdesk::KBDetail:DefaultShareTitle');
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      // ĐÃ SỬA: Ép kiểu any cho error
      }).catch((error: any) => {
        console.log(this.localizationService.instant('ItHelpdesk::KBDetail:ShareError'), error);
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::KBDetail:ToastCopySuccess'), 'success');
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/tickets/knowledge-base']);
  }

  showFeedbackToast(isPositive: boolean): void {
    const key = isPositive ? 'ItHelpdesk::KBDetail:ToastFeedbackYes' : 'ItHelpdesk::KBDetail:ToastFeedbackNo';
    this.customToast.show(this.localizationService.instant(key), 'success');
  }
}