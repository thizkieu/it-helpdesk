import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaqItemService } from '@proxy/knowledge-base';
import { CoreModule } from '@abp/ng.core';
import { ThemeSharedModule, ToasterService } from '@abp/ng.theme.shared';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit {
  private faqService = inject(FaqItemService);
  private toaster = inject(ToasterService); // Khởi tạo Toaster

  faqList: any[] = [];
  filteredFaqList: any[] = [];
  searchText: string = '';
  isLoading = true;

  ngOnInit(): void {
    this.loadFaqList();
  }

  loadFaqList(): void {
    this.isLoading = true;
    
    this.faqService.getList({ maxResultCount: 100 }).pipe(
      catchError(err => {
        // Đẩy bóng đẩy cảnh báo thay vì làm sập trang
        this.toaster.info('Đang sử dụng dữ liệu cẩm nang ngoại tuyến.', 'Thông báo hệ thống');
        return of({ items: [], totalCount: 0 });
      })
    ).subscribe({
      next: (res: any) => {
        this.faqList = res.items || [];
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