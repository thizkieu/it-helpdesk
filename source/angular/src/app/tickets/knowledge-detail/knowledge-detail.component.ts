import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestService } from '@abp/ng.core';

@Component({
  selector: 'app-knowledge-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './knowledge-detail.component.html',
  styleUrls: ['./knowledge-detail.component.scss']
})
export class KnowledgeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restService = inject(RestService);

  article: any = null;
  isLoading: boolean = true;

  // Biến phục vụ tính năng phân trang tài liệu
  pages: string[] = [];
  currentPage: number = 0;

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.['article']) {
      this.article = navigation.extras.state['article'];
      this.processArticlePages();
      this.isLoading = false;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchArticleById(id);
    } else {
      this.isLoading = false;
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
        },
        error: (err) => {
          console.error('Không tìm thấy bài viết', err);
          this.isLoading = false;
        }
      });
  }

  // Hàm chia nhỏ nội dung thành các trang dựa trên thẻ <hr class="page-break">
  processArticlePages(): void {
    const rawContent = this.article?.fullContent || this.article?.answer || this.article?.Answer || '';
    if (!rawContent) {
      this.pages = [''];
      return;
    }

    // Tách chuỗi HTML dựa vào thẻ phân trang chuyên dụng <hr class="page-break">
    this.pages = rawContent.split('<hr class="page-break">');
    this.currentPage = 0; // Luôn bắt đầu từ trang đầu tiên
  }

  // Chuyển trang tiếp theo
  nextPage(): void {
    if (this.currentPage < this.pages.length - 1) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang mượt mà
    }
  }

  // Quay lại trang trước
  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack(): void {
    this.router.navigate(['/tickets/knowledge-base']);
  }
}