import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { ConfigStateService, LocalizationService, LocalizationPipe, RestService } from '@abp/ng.core';
import { CustomToastService } from '../shared/services/custom-toast.service';
import { TeamService, TeamDto } from '@proxy/teams';
import { AvatarStateService } from '../shared/services/avatar-state.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LocalizationPipe],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  private ticketService = inject(TicketService);
  private teamService = inject(TeamService);
  private restService = inject(RestService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  public localizationService = inject(LocalizationService);
  private customToast = inject(CustomToastService);
  private config = inject(ConfigStateService);
  private avatarState = inject(AvatarStateService);

  ticket: TicketDto | null = null;
  isLoading: boolean = true;
  isAdmin: boolean = false;
  isITStaff: boolean = false;
  isFromTechKPI: boolean = false;
  currentUser: any;
  workspaceType: 'intake' | 'active' | 'pending' | 'archive' = 'intake';
  currentTab: 'info' | 'discuss' | 'history' | 'assign' = 'discuss';
  currentUserAvatarUrl: string = '';

  isAssignModalOpen: boolean = false;
  isAssignLoading: boolean = false;
  isSubmitting: boolean = false;
  allTeams: TeamDto[] = [];
  filteredTechnicians: any[] = [];
  assignForm: any = { ticketId: 0, assigneeId: undefined, teamId: undefined };

  isStatusModalOpen: boolean = false;
  statusData: any = { newStatus: null, comment: '' };
  ticketStatuses = [
    { value: 1, label: 'ItHelpdesk::Dashboard:Status.Assigned' },
    { value: 2, label: 'ItHelpdesk::Dashboard:Status.InProgress' },
    { value: 3, label: 'ItHelpdesk::Dashboard:Status.Pending' },
    { value: 4, label: 'ItHelpdesk::Dashboard:Status.Escalated' },
    { value: 5, label: 'ItHelpdesk::Dashboard:Status.Resolved' }
  ];

  isEditModalOpen: boolean = false;
  editData: any = { title: '', description: '' };

  newCommentContent: string = '';
  isInternalNote: boolean = false;
  isRecording: boolean = false;
  selectedFileName: string = '';
  quickReplies: string[] = [];
  replyingToComment: any = null;
  
  timeline: any[] = [];
  historyLogs: any[] = [];
  isLoadingHistory: boolean = false;
  visibleTimelineCount: number = 5;
  attachments: any[] = [];
  avatarErrors: { [key: string]: boolean } = {};

  isForceCloseModalOpen: boolean = false;
  cancelReason: string = '';
  isSavingCancel: boolean = false;

  ngOnInit(): void {
    this.currentUser = this.config.getOne('currentUser') as any;
    this.isAdmin = this.currentUser?.roles?.some((r: string) => r.toLowerCase() === 'admin') || false;
    this.isITStaff = this.isAdmin || this.currentUser?.roles?.some((r: string) => ['teamleader', 'technician'].includes(r.toLowerCase())) || false;
    this.avatarState.currentAvatar$.subscribe((avatarUrl: string) => {
      this.currentUserAvatarUrl = avatarUrl;
    });
    this.quickReplies = [
      this.localizationService.instant('ItHelpdesk::QuickReply:Received'),
      this.localizationService.instant('ItHelpdesk::QuickReply:NeedScreenshot'),
      this.localizationService.instant('ItHelpdesk::QuickReply:Maintenance'),
      this.localizationService.instant('ItHelpdesk::QuickReply:ResolvedCheck')
    ];
    this.route.queryParams.subscribe((params: any) => {
      if (params['fromTechKPI']) this.isFromTechKPI = true;
    });

    const routeParam = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('ticketNo');
    if (routeParam) {
      const numericId = Number(routeParam);
      if (!isNaN(numericId) && numericId > 0) {
        this.loadFullTicketData(numericId);
      } else {
        this.loadDataByTicketNo(routeParam);
      }
    } else {
      this.goBack();
    }
  }

  createFollowUp(): void {
    if (this.ticket) {
      this.router.navigate(['/tickets/create'], { 
        queryParams: { parentId: this.ticket.id, parentNo: this.ticket.ticketNo } 
      });
    }
  }

  getInitial(name?: string): string {
    if (!name || name.trim() === '') return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  onAvatarError(key: string): void {
    this.avatarErrors[key] = true;
  }

  getTimelineAvatarUrl(item: any): string {
    if (item.creatorAvatar) return item.creatorAvatar;
    if (item.creatorId) return `/api/account/profile-picture/${item.creatorId}`;
    return '/api/account/profile-picture';
  }

  loadDataByTicketNo(ticketNo: string): void {
    this.isLoading = true;
    this.ticketService.getList({ filter: ticketNo, maxResultCount: 1 } as any).subscribe({
      next: (res: any) => {
        if (res.items && res.items.length > 0) {
          const tId = res.items[0].id;
          if (tId) this.loadFullTicketData(tId);
        } else {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
          this.goBack();
        }
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
        this.goBack();
      }
    });
  }

  loadFullTicketData(id: number): void {
    this.ticketService.get(id).subscribe({
      next: (ticket: any) => {
        this.ticket = ticket;
        this.determineWorkspace();
        this.loadTimeline();
        this.isLoading = false;
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
        this.goBack();
      }
    });
  }

  determineWorkspace(): void {
    if (!this.ticket) return;
    const s = this.ticket.status;
    if (s === 6 || s === 7) { this.workspaceType = 'archive'; this.currentTab = 'info'; }
    else if (s === 0) { this.workspaceType = 'intake'; }
    else if (s === 3) { this.workspaceType = 'pending'; }
    else { this.workspaceType = 'active'; }
  }

  switchTab(tab: 'info' | 'discuss' | 'history' | 'assign'): void {
    this.currentTab = tab;
    if (tab === 'history') this.fetchSystemHistory();
  }

  getStatusText(status: number | undefined): string {
    if (status === undefined) return '';
    const statusMap: any = { 0: 'ItHelpdesk::Dashboard:Status.New', 1: 'ItHelpdesk::Dashboard:Status.Assigned', 2: 'ItHelpdesk::Dashboard:Status.InProgress', 3: 'ItHelpdesk::Dashboard:Status.Pending', 4: 'ItHelpdesk::Dashboard:Status.Escalated', 5: 'ItHelpdesk::Dashboard:Status.Resolved', 6: 'ItHelpdesk::Dashboard:Status.Completed', 7: 'ItHelpdesk::Dashboard:Status.Closed' };
    return this.localizationService.instant(statusMap[status] || 'ItHelpdesk::Enum:TicketStatus.Undefined');
  }

  getSlaStatus(dateValue?: string | Date | null): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';
    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);
    if (targetDate < now) return 'overdue';
    else if (diffHours <= 2 && diffHours > 0) return 'warning';
    return 'normal';
  }

  goBack(): void { this.location.back(); }

  openAssignModal(): void {
    if (!this.ticket) return;
    this.teamService.getList({ maxResultCount: 100 } as any).subscribe((res: any) => {
      this.allTeams = res.items || [];
      this.assignForm = { ticketId: this.ticket!.id, assigneeId: this.ticket!.assigneeId || undefined, teamId: this.ticket!.teamId || undefined };
      
      this.filteredTechnicians = [];
      if (this.assignForm.teamId) {
        this.onTeamChange(this.assignForm.teamId, true);
      }
      this.isAssignModalOpen = true;
    });
  }

  onTeamChange(teamId: number | undefined, isInit: boolean = false): void {
    if (!isInit) this.assignForm.assigneeId = undefined;
    if (!teamId) { this.filteredTechnicians = []; return; }
    
    this.isAssignLoading = true;
    this.restService.request<any, any>({ method: 'GET', url: `/api/app/team/${teamId}/members` }).subscribe({
      next: (res: any[]) => { this.filteredTechnicians = res || []; this.isAssignLoading = false; },
      error: () => { this.filteredTechnicians = []; this.isAssignLoading = false; } 
    });
  }

  closeAssignModal(): void { this.isAssignModalOpen = false; }

  submitAssign(): void {
    if (!this.ticket) return;
    if (!this.assignForm.teamId && this.assignForm.assigneeId) {
       this.customToast.show(this.localizationService.instant('ItHelpdesk::TicketError:TeamRequiredForAssignee'), 'error');
       return;
    }
    this.isSubmitting = true;
    this.ticketService.assignTicket(this.assignForm).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:AssignSuccess'), 'success');
        this.isSubmitting = false;
        this.closeAssignModal();
        if (this.ticket && this.ticket.id) this.loadFullTicketData(this.ticket.id);
      },
      error: (err: any) => {
        const errorObj = err?.error?.error || err?.error || err;
        const msg = errorObj?.message || errorObj?.details || this.localizationService.instant('ItHelpdesk::Error:Generic');
        this.customToast.show(msg, 'error');
        this.isSubmitting = false;
      }
    });
  }

  openEditModal(): void {
    if (!this.ticket) return;
    this.editData = { title: this.ticket.title, description: this.ticket.description };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void { this.isEditModalOpen = false; }

  submitEdit(): void {
    if (!this.ticket || !this.ticket.id) return;
    this.isSubmitting = true;
    this.ticketService.update(this.ticket.id, this.editData).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:UpdateSuccess'), 'success');
        this.closeEditModal();
        this.loadFullTicketData(this.ticket!.id!);
        this.isSubmitting = false;
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        this.isSubmitting = false;
      }
    });
  }

  openStatusModal(): void {
    if (!this.ticket) return;
    this.statusData = { newStatus: this.ticket.status, comment: '' };
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void { this.isStatusModalOpen = false; }
  
  submitStatusChange(): void {
    if (!this.ticket || !this.ticket.id) return;
    this.isSubmitting = true;
    this.restService.request<any, any>({
      method: 'POST',
      url: `/api/app/ticket/change-status`,
      body: { ticketId: this.ticket.id, newStatus: this.statusData.newStatus, comment: this.statusData.comment }
    }).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:UpdateSuccess'), 'success');
        this.isSubmitting = false;
        this.closeStatusModal();
        this.loadFullTicketData(this.ticket!.id!);
      },
      error: () => { 
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error'); 
        this.isSubmitting = false; 
      }
    });
  }

  cancelTicketByUser(): void {
    if (!this.ticket || !this.ticket.id) return;
    if (confirm(this.localizationService.instant('ItHelpdesk::Message:ConfirmCancel'))) {
      this.restService.request<any, any>({
        method: 'POST',
        url: `/api/app/ticket/${this.ticket.id}/cancel-ticket`,
        body: { reason: this.localizationService.instant('ItHelpdesk::System:UserCanceledLog') }
      }).subscribe({
        next: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CancelSuccess'), 'success');
          this.loadFullTicketData(this.ticket!.id!);
        },
        error: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        }
      });
    }
  }

  completeTicket(): void {
    if (!this.ticket || !this.ticket.id) return;
    if (confirm(this.localizationService.instant('ItHelpdesk::Message:ConfirmComplete'))) {
      this.restService.request<any, any>({
        method: 'POST',
        url: `/api/app/ticket/change-status`,
        body: { ticketId: this.ticket.id, newStatus: 6, comment: this.localizationService.instant('ItHelpdesk::System:TicketCompletedLog') }
      }).subscribe({
        next: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CompleteSuccess'), 'success');
          this.loadFullTicketData(this.ticket!.id!);
        },
        error: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        }
      });
    }
  }

  closeTicket(): void {
    if (!this.ticket) return;
    this.openForceCloseModal(this.ticket);
  }

  openForceCloseModal(ticket: TicketDto): void {
    this.cancelReason = '';
    this.isForceCloseModalOpen = true;
  }

  closeForceCloseModal(): void {
    this.isForceCloseModalOpen = false;
    this.cancelReason = '';
  }

  submitForceClose(): void {
    if (!this.cancelReason || !this.cancelReason.trim()) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Queue:ErrorReasonRequired'), 'error');
        return;
    }
    if (!this.ticket || !this.ticket.id) return;
    this.isSavingCancel = true;
    
    this.restService.request<any, any>({
        method: 'POST',
        url: `/api/app/ticket/${this.ticket.id}/cancel-ticket`,
        body: { reason: this.cancelReason }
    }).subscribe({
        next: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CancelSuccess'), 'success');
            this.isSavingCancel = false;
            this.closeForceCloseModal();
            this.loadFullTicketData(this.ticket!.id!);
        },
        error: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
            this.isSavingCancel = false;
        }
    });
  }

  goToAssigneeDetail(): void { 
    if (this.ticket?.assigneeId) this.router.navigate(['/dashboard/technician', this.ticket.assigneeId]); 
  }
  
  applyQuickReply(reply: string): void { this.newCommentContent = reply; }
  cancelReply(): void { this.replyingToComment = null; }
  onFileSelected(event: any): void {}
  toggleRecording(): void { this.isRecording = !this.isRecording; }

  sendComment(): void {
    if(!this.ticket || !this.ticket.id) return;
    const content = this.newCommentContent.trim();
    if(!content && !this.selectedFileName) return;
    
    this.isSubmitting = true;
    
    this.restService.request<any, any>({
        method: 'POST',
        url: `/api/app/ticket/comment`,
        params: {
            ticketId: this.ticket.id,
            content: content,
            isInternal: this.isInternalNote,
            parentId: this.replyingToComment ? this.replyingToComment.id : null
        }
    }).subscribe({
        next: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CommentSuccess'), 'success');
            this.newCommentContent = '';
            this.replyingToComment = null;
            this.isSubmitting = false;
            this.loadTimeline();
        },
        error: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
            this.isSubmitting = false;
        }
    });
  }

  toggleLike(item: any): void {}
  startReply(item: any): void { this.replyingToComment = item; }
  
  // =========================================================================
  // FIX 100%: DÙNG URL SẠCH, LOẠI BỎ THUỘC TÍNH PARAMS ĐỂ TRÁNH LỖI 400
  // =========================================================================
  loadTimeline(): void {
    if(!this.ticket || !this.ticket.id) return;
    
    this.restService.request<any, any>({
        method: 'GET',
        // Gắn cứng ID vào URL, tuyệt đối không dùng params
        url: `/api/app/ticket/${this.ticket.id}/timeline` 
    }).subscribe({
        next: (res) => {
            this.timeline = (res || []).filter((x: any) => x.type === 'Comment');
        }
    });
  }
  
  loadMoreTimeline(): void { this.visibleTimelineCount += 5; }
  
  fetchSystemHistory(): void {
    this.isLoadingHistory = true;
    if(!this.ticket || !this.ticket.id) {
        this.isLoadingHistory = false; return;
    }
    
    this.restService.request<any, any>({
        method: 'GET',
        // Gắn cứng ID vào URL, tuyệt đối không dùng params
        url: `/api/app/ticket/${this.ticket.id}/timeline` 
    }).subscribe({
        next: (res) => {
            this.historyLogs = (res || []).filter((x: any) => x.type === 'Activity');
            this.isLoadingHistory = false;
        },
        error: () => {
            this.historyLogs = [];
            this.isLoadingHistory = false;
        }
    });
  }

  getActionName(type: string): string {
    const map: any = {
        'TicketCreated': 'ItHelpdesk::SystemHistory:ActionCreate',
        'TicketAssigned': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'StatusChange': 'ItHelpdesk::SystemHistory:ActionUpdate',
        'CommentAdded': 'ItHelpdesk::SystemHistory:ActionComment',
        'TicketCanceled': 'ItHelpdesk::SystemHistory:ActionDelete',
        'FileUploaded': 'ItHelpdesk::SystemHistory:ActionUpdate'
    };
    return this.localizationService.instant(map[type] || 'ItHelpdesk::SystemHistory:ActionUpdate');
  }

  getActionTheme(type: string): string {
    if(type === 'TicketCreated') return 'theme-success';
    if(type === 'TicketCanceled') return 'theme-danger';
    if(type === 'CommentAdded') return 'theme-info';
    return 'theme-warning';
  }

  getActionIcon(type: string): string {
    if(type === 'TicketCreated') return 'fas fa-plus-circle';
    if(type === 'TicketCanceled') return 'fas fa-times-circle';
    if(type === 'CommentAdded') return 'fas fa-comment-dots';
    if(type === 'StatusChange') return 'fas fa-exchange-alt';
    if(type === 'TicketAssigned') return 'fas fa-user-check';
    return 'fas fa-info-circle';
  }
}