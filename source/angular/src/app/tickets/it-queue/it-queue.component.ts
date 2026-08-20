import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto, GetTicketListDto } from '@proxy/tickets';
import { CoreModule, ListService, PagedResultDto } from '@abp/ng.core';
import { ThemeSharedModule, ToasterService } from '@abp/ng.theme.shared'; // Thêm ToasterService
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-it-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, NgxDatatableModule],
  templateUrl: './it-queue.component.html',
  styleUrls: ['./it-queue.component.scss'],
  providers: [ListService]
})
export class ItQueueComponent implements OnInit {
  private ticketService = inject(TicketService);
  public readonly list = inject(ListService);
  private toaster = inject(ToasterService); // Khởi tạo Toaster

  items: TicketDto[] = [];
  totalCount = 0;

  currentTab: 'all' | 'unassigned' | 'mine' | 'team' = 'all';
  searchFilter: string = '';

  currentUserId = '00000000-0000-0000-0000-000000000000';
  currentTeamId = 1;

  ngOnInit(): void {
    const ticketStreamCreator = (query: GetTicketListDto) => {
      query.filter = this.searchFilter;

      if (this.currentTab === 'unassigned') query.unassigned = true;
      if (this.currentTab === 'mine') query.assigneeId = this.currentUserId;
      if (this.currentTab === 'team') query.teamId = this.currentTeamId;

      return this.ticketService.getList(query);
    };

    this.list.hookToQuery(ticketStreamCreator).subscribe({
      next: (response: PagedResultDto<TicketDto>) => {
        this.items = response.items || [];
        this.totalCount = response.totalCount || 0;
      },
      error: (err) => {
        // HIỂN THỊ THÔNG BÁO LỖI DẠNG BÓNG ĐẨY (TOAST)
        this.toaster.error('Không thể tải dữ liệu hàng đợi từ máy chủ. Vui lòng thử lại sau!', 'Lỗi kết nối');
        console.error(err);
      }
    });
  }

  changeTab(tab: 'all' | 'unassigned' | 'mine' | 'team'): void {
    this.currentTab = tab;
    this.list.get();
  }

  onSearch(): void {
    this.list.get();
  }

  getSlaStatus(dateValue: string | Date): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';

    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);

    if (targetDate < now) {
      return 'overdue';
    } else if (diffHours <= 2) {
      return 'warning';
    }

    return 'normal';
  }
}