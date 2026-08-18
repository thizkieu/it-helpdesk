import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { TicketCommentService, TicketCommentDto } from '@proxy/tickets'; 
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
  private commentService = inject(TicketCommentService);

  ticketId: number = 0;
  ticket: TicketDto | null = null;
  comments: TicketCommentDto[] = [];
  newCommentContent: string = '';
  
  isLoading = true;
  isSubmitting = false; // Thêm cờ chống spam click

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ticketId = Number(idParam);
      this.loadTicketDetail();
      this.loadComments();
    }
  }

  loadTicketDetail(): void {
    this.isLoading = true;
    this.ticketService.get(this.ticketId).subscribe({
      next: (res: any) => {
        this.ticket = res;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Lỗi khi tải chi tiết Ticket:', err);
        this.isLoading = false;
      }
    });
  }

  loadComments(): void {
    this.commentService.getListByTicketId(this.ticketId).subscribe({
      next: (res: any) => {
        this.comments = res?.items || res || [];
      },
      error: (err: any) => {
        console.error('Lỗi khi tải danh sách bình luận:', err);
      }
    });
  }

  sendComment(): void {
    if (!this.newCommentContent || !this.newCommentContent.trim() || this.isSubmitting) return;

    this.isSubmitting = true; 
    const input = {
      ticketId: this.ticketId,
      content: this.newCommentContent,
      isInternal: false
    };

    this.commentService.create(input).subscribe({
      next: () => {
        this.newCommentContent = '';
        this.isSubmitting = false;
        this.loadComments();
      },
      error: (err: any) => {
        console.error('Lỗi khi gửi bình luận:', err);
        this.isSubmitting = false; 
      }
    });
  }
}