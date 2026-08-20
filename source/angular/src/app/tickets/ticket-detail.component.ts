import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto, TicketTimelineDto } from '@proxy/tickets';
import { CoreModule } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);

  ticketId: number = 0;
  ticket: TicketDto | null = null;
  timeline: TicketTimelineDto[] = [];
  newCommentContent: string = '';

  // Biến dùng để lưu tên file hiển thị trực quan lên giao diện
  selectedFileName: string | null = null;

  isLoading = true;
  isSubmitting = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ticketId = Number(idParam);
      this.loadTicketDetail();
      this.loadTimeline();
    }
  }

  loadTicketDetail(): void {
    this.isLoading = true;
    this.ticketService.get(this.ticketId).subscribe({
      next: (res: TicketDto) => {
        this.ticket = res;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Lỗi khi tải chi tiết Ticket:', err);
        this.isLoading = false;
      }
    });
  }

  loadTimeline(): void {
    this.ticketService.getTimeline(this.ticketId).subscribe({
      next: (res: TicketTimelineDto[]) => {
        this.timeline = res || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi tải lịch sử timeline:', err);
      }
    });
  }

  sendComment(): void {
    if (!this.newCommentContent || !this.newCommentContent.trim() || this.isSubmitting) return;

    this.isSubmitting = true;

    this.ticketService.addComment(this.ticketId, this.newCommentContent, false).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.isSubmitting = false;
        this.loadTimeline();
      },
      error: (err: any) => {
        console.error('Lỗi khi gửi bình luận:', err);
        this.isSubmitting = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file dưới 10MB.');
      return;
    }

    // Hiển thị tên file lên giao diện ngay lập tức
    this.selectedFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result.split(',')[1];

      // Đóng gói thành Object (DTO) để gửi qua Request Body
      const input = {
        ticketId: this.ticketId,
        fileName: file.name,
        base64Content: base64String,
        contentType: file.type
      };

      this.isSubmitting = true;
      this.ticketService.uploadAttachment(input).subscribe({
        next: () => {
          this.loadTimeline();
          this.isSubmitting = false;
          // Có thể reset lại tên file sau khi upload xong hoặc giữ lại thông báo thành công
          setTimeout(() => {
            this.selectedFileName = null;
          }, 3000);
        },
        error: (err: any) => {
          console.error('Lỗi upload:', err);
          alert('Upload thất bại, vui lòng kiểm tra lại!');
          this.isSubmitting = false;
          this.selectedFileName = null;
        }
      });
    };
    reader.readAsDataURL(file);
  }
  // ==========================================
  // PHÂN LOẠI TRẠNG THÁI SLA ĐỂ HIỂN THỊ MÀU SẮC
  // ==========================================
  getSlaStatus(dateValue: string | Date | null | undefined): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';
    
    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);

    if (targetDate < now) {
      return 'overdue'; // Quá hạn -> Đỏ
    } else if (diffHours <= 2) {
      return 'warning'; // Sắp hết hạn (dưới 2 tiếng) -> Vàng
    }
    
    return 'normal'; // Bình thường -> Trắng/Sáng
  }

  // Biến quản lý trạng thái hiển thị modal
  isAssignModalOpen: boolean = false;
  assigneeInputId: string = '';
  teamInputId: string = '';

  openAssignModal(): void {
    this.isAssignModalOpen = true;
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
  }

  submitAssign(): void {
    const input = {
      ticketId: this.ticketId,
      assigneeId: this.assigneeInputId ? this.assigneeInputId.trim() : undefined,
      teamId: this.teamInputId ? Number(this.teamInputId) : undefined
    };

    this.isSubmitting = true;
    this.ticketService.assignTicket(input).subscribe({
      next: () => {
        alert('Phân công thành công!');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isSubmitting = false;
        this.assigneeInputId = '';
        this.teamInputId = '';
        this.isAssignModalOpen = false; // Đóng modal
      },
      error: (err: any) => {
        console.error('Lỗi phân công:', err);
        alert('Phân công thất bại, vui lòng kiểm tra lại!');
        this.isSubmitting = false;
      }
    });
  }
}