import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationPipe } from '@abp/ng.core';
import { NotificationService } from '@proxy/notifications';
import { SignalRService } from '../../shared/services/signalr.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, LocalizationPipe],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private signalRService = inject(SignalRService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  notifications: any[] = [];
  filter: 'all' | 'unread' = 'all';
  isLoading = false;

  ngOnInit(): void {
    this.loadNotifications();
    this.signalRService.resetUnreadCount();

    this.signalRService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getMyNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res?.items || res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Lỗi tải thông báo:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  markAsRead(item: any): void {
    if (item.isRead) return;
    this.notificationService.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Lỗi cập nhật trạng thái:', err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.signalRService.resetUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Lỗi thao tác hàng loạt:', err);
      }
    });
  }

  clearAll(): void {
    this.notifications = [];
    this.signalRService.resetUnreadCount();
    localStorage.removeItem('app_notifications');
    this.cdr.detectChanges();
  }

  get filteredNotifications() {
    if (this.filter === 'unread') {
      return this.notifications.filter(n => !n.isRead);
    }
    return this.notifications;
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getIconClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'success': return 'fa-check-circle text-success';
      case 'warning': return 'fa-exclamation-triangle text-warning';
      case 'error': return 'fa-times-circle text-danger';
      default: return 'fa-info-circle text-info';
    }
  }
}