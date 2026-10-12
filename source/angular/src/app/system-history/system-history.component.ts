import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationPipe, LocalizationService, ConfigStateService } from '@abp/ng.core';
import { RestService } from '@abp/ng.core'; 
import { ToasterService, ThemeSharedModule } from '@abp/ng.theme.shared';

@Component({
  selector: 'app-system-history',
  standalone: true,
  imports: [CommonModule, LocalizationPipe, ThemeSharedModule],
  templateUrl: './system-history.component.html',
  styleUrls: ['./system-history.component.scss']
})
export class SystemHistoryComponent implements OnInit {
  private configState = inject(ConfigStateService);
  private restService = inject(RestService);
  private toaster = inject(ToasterService);
  public localizationService = inject(LocalizationService);
  private cdr = inject(ChangeDetectorRef);
  
  isLoading = false;
  historyLogs: any[] = [];
  currentUser: any;

  ngOnInit(): void {
    this.currentUser = this.configState.getOne('currentUser');
    this.fetchHistory();
  }

  fetchHistory(): void {
    this.isLoading = true;
    
    // Gọi API thật từ hệ thống (Lấy lịch sử hoạt động chung)
    this.restService.request<any, any>({
        method: 'GET',
        url: '/api/app/ticket/system-history', // Đường dẫn API có thể điều chỉnh theo backend thực tế
        params: { maxResultCount: 100, skipCount: 0 }
    }).subscribe({
        next: (res) => {
            this.historyLogs = res.items || res || [];
            this.isLoading = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            this.isLoading = false;
            const errorObj = err?.error?.error || err?.error || err;
            const msg = errorObj?.message || errorObj?.details || this.localizationService.instant('ItHelpdesk::Error:Generic');
            this.toaster.error(msg);
            this.cdr.detectChanges();
        }
    });
  }

  getActionTheme(type: string): string {
    const t = type?.toLowerCase() || '';
    if (t.includes('create') || t.includes('add')) return 'theme-success';
    if (t.includes('delete') || t.includes('cancel') || t.includes('remove')) return 'theme-danger';
    if (t.includes('comment')) return 'theme-info';
    if (t.includes('system')) return 'theme-warning';
    return 'theme-primary'; // Default cho Update/Assigned...
  }

  getActionIcon(type: string): string {
    const t = type?.toLowerCase() || '';
    if (t.includes('create') || t.includes('add')) return 'fas fa-plus-circle';
    if (t.includes('delete') || t.includes('cancel')) return 'fas fa-trash-alt';
    if (t.includes('comment')) return 'fas fa-comment-dots';
    if (t.includes('system')) return 'fas fa-cogs';
    if (t.includes('status')) return 'fas fa-exchange-alt';
    if (t.includes('assign')) return 'fas fa-user-check';
    if (t.includes('file') || t.includes('upload')) return 'fas fa-paperclip';
    return 'fas fa-history';
  }

  getActionName(type: string): string {
    // Tự động map các Action sang mã Đa ngôn ngữ (i18n)
    const map: any = {
        'TicketCreated': 'ItHelpdesk::SystemHistory:ActionCreate',
        'TicketAssigned': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'StatusChange': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'CommentAdded': 'ItHelpdesk::SystemHistory:ActionComment',
        'TicketCanceled': 'ItHelpdesk::SystemHistory:ActionDelete',
        'FileUploaded': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'Create': 'ItHelpdesk::SystemHistory:ActionCreate',
        'Update': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'Delete': 'ItHelpdesk::SystemHistory:ActionDelete',
        'System': 'ItHelpdesk::SystemHistory:ActionSystem'
    };
    return this.localizationService.instant(map[type] || 'ItHelpdesk::SystemHistory:ActionUpdate');
  }
}