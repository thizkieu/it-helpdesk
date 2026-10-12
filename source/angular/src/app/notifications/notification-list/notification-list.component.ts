import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationService, RestService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { NotificationService } from '@proxy/notifications';
import { SignalRService } from '../../shared/services/signalr.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService, Confirmation, ThemeSharedModule } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, LocalizationPipe, ThemeSharedModule],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss']
})
export class NotificationListComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private restService = inject(RestService);
  private signalRService = inject(SignalRService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  public localizationService = inject(LocalizationService);
  private confirmation = inject(ConfirmationService);
  private config = inject(ConfigStateService);
  private destroy$ = new Subject<void>();
  
  notifications: any[] = [];
  filter: 'all' | 'unread' = 'all';
  isLoading = false;
  isMarkingAll = false;
  isClearingAll = false;
  activeDropdownId: any = null;
  selectedLog: any = null;
  showPreviewModal = false;

  @HostListener('document:click')
  closeDropdown(): void {
    if (this.activeDropdownId !== null) {
      this.activeDropdownId = null;
      this.cdr.detectChanges();
    }
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.signalRService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      if (!this.isClearingAll && count > 0) {
        this.loadNotifications();
      }
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
        const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
        const isEn = lang.toLowerCase().includes('en');
        const rawItems = res?.items || res || [];

        // ÁP DỤNG ĐA NGÔN NGỮ THÔNG MINH CHO CẢ UI
        this.notifications = rawItems.map((item: any) => {
           const localizedTitle = isEn ? (item.title_En || item.title_Vi || item.title) : (item.title_Vi || item.title_En || item.title);
           const localizedMessage = isEn ? (item.message_En || item.message_Vi || item.message) : (item.message_Vi || item.message_En || item.message);
           
           return {
             ...item,
             localizedTitle: localizedTitle || this.localizationService.instant('ItHelpdesk::Notification:SystemTitle'),
             localizedMessage: localizedMessage || ''
           };
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(this.localizationService.instant('ItHelpdesk::Notification:ErrorLoad'), err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get groupedTimeline() {
    let source = this.notifications;
    if (this.filter === 'unread') source = source.filter(n => !n.isRead);
    const grouped: any[] = [];
    let currentLabel = '';
    let currentGroup: any = null;
    
    source.forEach(item => {
      const dateObj = new Date(item.creationTime);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      let label = dateObj.toLocaleDateString();
      if (dateObj.toDateString() === today.toDateString()) {
        label = this.localizationService.instant('ItHelpdesk::Notification:Today');
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        label = this.localizationService.instant('ItHelpdesk::Notification:Yesterday');
      }
      
      if (label !== currentLabel) {
        currentLabel = label;
        currentGroup = { label: currentLabel, items: [] };
        grouped.push(currentGroup);
      }
      currentGroup.items.push(item);
    });
    return grouped;
  }

  trackByGroup(index: number, group: any): string { return group.label; }
  trackByItem(index: number, item: any): string { return item.id; }
  
  toggleDropdown(item: any, event: Event): void {
    event.stopPropagation();
    this.activeDropdownId = this.activeDropdownId === item.id ? null : item.id;
    this.cdr.detectChanges();
  }

  // =========================================================
  // FIX: XỬ LÝ NAVIGATE KHI CLICK VÀO KHUNG THÔNG BÁO HOẶC MODAL
  // =========================================================
  goToLink(item: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.activeDropdownId = null;
    
    if (!item.isRead) {
      this.markAsRead(item);
    }
    
    // Lấy URL thực tế
    const url = item.linkUrl || item.LinkUrl || item.extraProperties?.linkUrl || item.extraProperties?.LinkUrl;
    
    if (url && typeof url === 'string' && url.trim() !== '') {
      // Đóng modal preview nếu đang mở
      this.closePreviewModal(); 
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank');
      } else {
        // Router Navigate thực tế
        this.router.navigateByUrl(url).catch(err => console.warn('Routing warning:', err));
      }
    } else {
        // Nếu không có link mới mở Modal xem trước nội dung
        this.openPreviewModal(item, event!);
    }
  }

  openPreviewModal(item: any, event: Event): void {
    if (event) event.stopPropagation();
    this.activeDropdownId = null;
    
    if (!item.isRead) this.markAsRead(item);
    
    this.selectedLog = item;
    this.showPreviewModal = true;
    this.cdr.detectChanges();
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    setTimeout(() => {
        this.selectedLog = null;
        this.cdr.detectChanges();
    }, 300);
  }

  markAsRead(item: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeDropdownId = null;
    if (item.isRead) return;
    
    item.isRead = true;
    this.cdr.detectChanges();
    
    this.notificationService.markAsRead(item.id).subscribe({
      error: err => {
        item.isRead = false;
        console.error(this.localizationService.instant('ItHelpdesk::Notification:ErrorMarkRead'), err);
        this.cdr.detectChanges();
      }
    });
  }

  deleteItem(item: any, event: Event): void {
    event.stopPropagation();
    this.activeDropdownId = null;
    this.notifications = this.notifications.filter(n => n.id !== item.id);
    this.cdr.detectChanges();
    
    this.notificationService.delete(item.id).subscribe({
      error: (err: any) => console.error(this.localizationService.instant('ItHelpdesk::Notification:ErrorDelete'), err)
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0 || this.isMarkingAll) return;
    this.isMarkingAll = true;
    this.notifications.forEach(n => (n.isRead = true));
    this.cdr.detectChanges();
    
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAll = false;
        this.signalRService.resetUnreadCount();
        this.cdr.detectChanges();
      },
      error: err => {
        this.isMarkingAll = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearAll(): void {
    if (this.notifications.length === 0 || this.isClearingAll) return;
    
    const confirmMsg = this.localizationService.instant('ItHelpdesk::Notification:ConfirmClearAll');
    const confirmTitle = this.localizationService.instant('ItHelpdesk::ConfirmAction');
    
    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
        if (status === Confirmation.Status.confirm) {
            this.isClearingAll = true;
            this.notifications = [];
            this.cdr.detectChanges();
            
            this.restService.request<void, void>({
              method: 'DELETE',
              url: '/api/app/notification/all-my-notifications'
            }).subscribe({
              next: () => {
                this.isClearingAll = false;
                this.signalRService.resetUnreadCount();
                this.cdr.detectChanges();
              },
              error: (err: any) => {
                this.isClearingAll = false;
                this.cdr.detectChanges();
              }
            });
        }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getSeverityIcon(item: any): string {
    const type = (item.type || '').toLowerCase();
    if (type === 'error' || type === 'danger' || type === 'fatal') return 'fas fa-exclamation-triangle';
    if (type === 'warning') return 'fas fa-exclamation-circle';
    if (type === 'success') return 'fas fa-check-circle';
    return 'fas fa-info-circle';
  }

  getSeverityTheme(item: any): string {
    const type = (item.type || '').toLowerCase();
    if (type === 'error' || type === 'danger' || type === 'fatal') return 'theme-danger';
    if (type === 'warning') return 'theme-warning';
    if (type === 'success') return 'theme-success';
    if (type === 'info') return 'theme-info';
    return 'theme-primary';
  }

  hasLink(item: any): boolean {
    const url = item.linkUrl || item.LinkUrl || item.extraProperties?.linkUrl || item.extraProperties?.LinkUrl;
    return !!(url && typeof url === 'string' && url.trim() !== '');
  }
}