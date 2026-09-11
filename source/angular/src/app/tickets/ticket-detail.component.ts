import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto } from '@proxy/tickets';
import { CoreModule, RestService, LocalizationService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { CustomToastService } from '../shared/services/custom-toast.service';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CoreModule, ThemeSharedModule, LocalizationPipe],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private confirmation = inject(ConfirmationService);
  private config = inject(ConfigStateService);
  public localizationService = inject(LocalizationService);

  ticketId: number = 0;
  ticket: TicketDto | null = null;
  timeline: any[] = [];
  visibleTimelineCount: number = 10;
  newCommentContent: string = '';

  isInternalNote: boolean = false;
  selectedFileName: string | null = null;
  isLoading = true;
  isSubmitting = false;

  isITStaff: boolean = false;

  currentTab: 'discuss' | 'info' | 'assign' = 'discuss';

  isAssignModalOpen: boolean = false;
  assigneeInputId: string = '';
  teamInputId: string = '';
  assigneeSearchText: string = '';
  teamSearchText: string = '';

  isEditModalOpen: boolean = false;
  editData = { title: '', description: '' };

  isStatusModalOpen: boolean = false;
  statusData = { newStatus: (this.ticket?.status ?? 1) as number, comment: '' };
  ticketStatuses = [
    { value: 1, label: 'ItHelpdesk::Enum:TicketStatus.1' },
    { value: 2, label: 'ItHelpdesk::Enum:TicketStatus.2' },
    { value: 3, label: 'ItHelpdesk::Enum:TicketStatus.3' },
    { value: 4, label: 'ItHelpdesk::Enum:TicketStatus.4' },
    { value: 5, label: 'ItHelpdesk::Enum:TicketStatus.5' },
    { value: 6, label: 'ItHelpdesk::Enum:TicketStatus.6' },
    { value: 7, label: 'ItHelpdesk::Enum:TicketStatus.7' }
  ];

  allTechnicians: any[] = [];
  filteredTechnicians: any[] = [];
  recentTechnicians: any[] = [];
  showTechDropdown: boolean = false;

  allTeams: any[] = [];
  filteredTeams: any[] = [];
  showTeamDropdown: boolean = false;

  isRecording: boolean = false;
  recognition: any;
  attachments: any[] = [];

  private hubConnection!: signalR.HubConnection;
  replyingToComment: any | null = null;
  returnUrl: string = '/tickets/my-tickets';

  // Chuyển mảng này thành rỗng, sẽ được load bằng file JSON trong ngOnInit
  quickReplies: string[] = [];

  get workspaceType(): 'intake' | 'active' | 'pending' | 'archive' {
    if (!this.ticket) return 'active';
    switch (Number(this.ticket.status)) {
      case 0: return 'intake';
      case 3: return 'pending';
      case 6:
      case 7: return 'archive';
      default: return 'active';
    }
  }

  switchTab(tab: 'info' | 'discuss' | 'assign'): void {
    this.currentTab = tab;
  }

  getStatusText(status: number | undefined): string {
    if (status === undefined || status === null) {
      return this.localizationService.instant('ItHelpdesk::Enum:TicketStatus.Undefined');
    }
    
    if (!this.isITStaff) {
       switch (status) {
         case 0: return this.localizationService.instant('ItHelpdesk::UserStatus:Submitted');
         case 1: return this.localizationService.instant('ItHelpdesk::UserStatus:AwaitingAssignment');
         case 2: return this.localizationService.instant('ItHelpdesk::UserStatus:Assigned');
         case 3: 
         case 4: 
         case 5: return this.localizationService.instant('ItHelpdesk::UserStatus:InProgress');
         case 6: return this.localizationService.instant('ItHelpdesk::UserStatus:Completed');
         case 7: return this.localizationService.instant('ItHelpdesk::UserStatus:Closed');
       }
    }

    const key = `ItHelpdesk::Enum:TicketStatus.${status}`;
    const translated = this.localizationService.instant(key);
    return translated !== key ? translated : `Status (${status})`;
  }

  startReply(comment: any): void {
    this.replyingToComment = comment;
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  }

  cancelReply(): void {
    this.replyingToComment = null;
  }

  applyQuickReply(reply: string): void {
    if (this.newCommentContent.trim()) {
      this.newCommentContent += ' ' + reply;
    } else {
      this.newCommentContent = reply;
    }
  }

  toggleLike(item: any): void {
    item.isLiked = !item.isLiked;
    item.likeCount = item.likeCount || 0;
    item.likeCount = item.isLiked ? item.likeCount + 1 : item.likeCount - 1;
  }

  loadMoreTimeline(): void {
    this.visibleTimelineCount += 10;
  }

  ngOnInit(): void {
    // Gọi dữ liệu QuickReplies trực tiếp từ file JSON ngôn ngữ
    this.quickReplies = [
      this.localizationService.instant('ItHelpdesk::QuickReply:Received'),
      this.localizationService.instant('ItHelpdesk::QuickReply:NeedScreenshot'),
      this.localizationService.instant('ItHelpdesk::QuickReply:ResolvedCheck'),
      this.localizationService.instant('ItHelpdesk::QuickReply:Maintenance')
    ];

    const currentUser = this.config.getOne('currentUser') as any;
    const roles: string[] = currentUser?.roles || [];
    this.isITStaff = roles.some(r => r.toLowerCase() !== 'end_user');

    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ticketId = Number(idParam);
      this.loadTicketDetail();
      this.loadTimeline();
    }
    const savedHistory = localStorage.getItem('it_recent_assignees');
    if (savedHistory) this.recentTechnicians = JSON.parse(savedHistory);

    this.initSpeechRecognition();
    this.initSignalRConnection();
  }

  ngOnDestroy(): void {
    if (this.hubConnection) this.hubConnection.stop();
  }

  goBack(): void {
    this.router.navigateByUrl(this.returnUrl);
  }

  private initSignalRConnection(): void {
    const baseUrl = environment.apis.default.url;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/signalr-hubs/ticket`, {
        accessTokenFactory: () => localStorage.getItem('access_token') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().then(() => {
      if (this.ticketId) {
        this.hubConnection.invoke('JoinTicketGroup', this.ticketId.toString()).catch(err => console.error(err));
      }
    }).catch(err => console.error('SignalR Connection Error: ', err));

    this.hubConnection.on('ReceiveTicketUpdate', (updatedTicketId: number) => {
      if (Number(updatedTicketId) === Number(this.ticketId)) {
        this.loadTicketDetail();
        this.loadTimeline();
      }
    });
  }

  loadTicketDetail(): void {
    this.isLoading = true;
    this.ticketService.get(this.ticketId).subscribe({
      next: (res: TicketDto) => {
        this.ticket = res;
        this.isLoading = false;
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'), 'error');
        this.isLoading = false;
      }
    });
  }

  loadTimeline(): void {
    this.ticketService.getTimeline(this.ticketId).subscribe({
      next: (res: any[]) => {
        this.timeline = res || [];
        this.timeline.forEach(t => {
          t.likeCount = t.likeCount || 0;
          t.isLiked = t.isLiked || false;
        });

        this.restService.request<any, any[]>({
          method: 'GET',
          url: `/api/app/ticket/${this.ticketId}/attachments`
        }).subscribe({
          next: (attRes) => {
            this.attachments = (attRes || []).map(a => ({
              name: a.fileName,
              type: a.contentType,
              url: `data:${a.contentType};base64,${a.base64Content}`
            }));
            this.timeline.forEach((item: any) => {
              if (item.type === 'Activity' && item.content && item.content.includes(':')) {
                const parts = item.content.split(':');
                if (parts.length > 1) {
                  const fileName = parts[1].trim();
                  const found = this.attachments.find(a => a.name === fileName);
                  if (found) {
                    item.attachmentUrl = found.url;
                    item.attachmentType = found.type;
                  }
                }
              }
            });
          }
        });
      }
    });
  }

  loadRealDataForAssignment(): void {
    this.ticketService.getAssignableTechnicians().subscribe({
      next: (res) => {
        const users = res || [];
        this.allTechnicians = users.map((u: any) => ({
          id: u.id,
          name: `${u.surname || ''} ${u.name || u.userName}`.trim(),
          email: u.email,
          isActive: u.isActive !== false
        }));
        this.filteredTechnicians = [...this.allTechnicians];
      }
    });

    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/app/team?maxResultCount=100'
    }).subscribe({
      next: (res) => {
        const teams = res.items || res || [];
        this.allTeams = teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          isActive: t.isActive !== false
        }));
        this.filteredTeams = [...this.allTeams];
      }
    });
  }

  openTechDropdownMenu(): void {
    this.showTechDropdown = true;
    this.showTeamDropdown = false;
  }

  openTeamDropdownMenu(): void {
    this.showTeamDropdown = true;
    this.showTechDropdown = false;
  }

  onSearchTechnician(keyword: string): void {
    this.assigneeSearchText = keyword;
    const lower = keyword.toLowerCase();
    this.filteredTechnicians = this.allTechnicians.filter(
      (x: any) => x.isActive && (x.name?.toLowerCase().includes(lower) || x.email?.toLowerCase().includes(lower))
    );
    this.openTechDropdownMenu();
  }

  selectTechnician(tech: any): void {
    this.assigneeInputId = tech.id;
    this.assigneeSearchText = tech.name;
    this.showTechDropdown = false;
    this.recentTechnicians = [tech, ...this.recentTechnicians.filter((x: any) => x.id !== tech.id)].slice(0, 3);
    localStorage.setItem('it_recent_assignees', JSON.stringify(this.recentTechnicians));
  }

  onSearchTeam(keyword: string): void {
    this.teamSearchText = keyword;
    const lower = keyword.toLowerCase();
    this.filteredTeams = this.allTeams.filter(
      (x: any) => x.isActive && (x.name?.toLowerCase().includes(lower) || x.code?.toLowerCase().includes(lower))
    );
    this.openTeamDropdownMenu();
  }

  selectTeam(team: any): void {
    this.teamInputId = team.id;
    this.teamSearchText = team.name;
    this.showTeamDropdown = false;
  }

  sendComment(): void {
    const trimmedComment = this.newCommentContent?.trim() || '';
    if (!trimmedComment && !this.selectedFileName) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Detail:ErrorCommentEmpty'), 'error');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const parentId = this.replyingToComment ? this.replyingToComment.id : null;

    const isInternal = this.isITStaff ? this.isInternalNote : false;

    (this.ticketService as any).addComment(this.ticketId, trimmedComment, isInternal, parentId).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CommentSuccess'), 'success');
        this.newCommentContent = '';
        this.isInternalNote = false;
        this.isSubmitting = false;
        this.replyingToComment = null;
        this.loadTimeline();
      },
      error: (err: any) => {
        this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        this.isSubmitting = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:FileTooLarge'), 'error');
      return;
    }

    this.selectedFileName = file.name;
    this.isSubmitting = true;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      this.restService.request<any, void>({
        method: 'POST',
        url: `/api/app/ticket/upload-attachment`,
        body: { ticketId: this.ticketId, fileName: file.name, contentType: file.type || 'application/octet-stream', base64Content: base64String }
      }).subscribe({
        next: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:UploadSuccess'), 'success');
          this.loadTimeline();
          this.isSubmitting = false;
          setTimeout(() => { this.selectedFileName = null; }, 3000);
        },
        error: () => {
          this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:UploadFailed'), 'error');
          this.isSubmitting = false;
          this.selectedFileName = null;
        }
      });
    };
  }

  getSlaStatus(dateValue: string | Date | null | undefined): 'normal' | 'warning' | 'overdue' {
    if (!dateValue) return 'normal';
    const targetDate = new Date(dateValue).getTime();
    const now = new Date().getTime();
    const diffHours = (targetDate - now) / (1000 * 60 * 60);

    if (targetDate < now) return 'overdue';
    else if (diffHours <= 2 && diffHours > 0) return 'warning';
    return 'normal';
  }

  cancelTicketByUser(): void {
    this.confirmation.warn(
      this.localizationService.instant('ItHelpdesk::Message:ConfirmCancel'), 
      this.localizationService.instant('ItHelpdesk::Title:ConfirmCancel')
    ).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.isSubmitting = true;
        this.ticketService.changeStatus({
          ticketId: this.ticketId,
          newStatus: 7, 
          comment: this.localizationService.instant('ItHelpdesk::System:UserCanceledLog')
        }).subscribe({
          next: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CancelSuccess'), 'success');
            this.loadTicketDetail();
            this.loadTimeline();
            this.isSubmitting = false;
          },
          error: (err: any) => {
            this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
            this.isSubmitting = false;
          }
        });
      }
    });
  }

  openAssignModal(): void {
    this.isAssignModalOpen = true;
    this.assigneeInputId = this.ticket?.assigneeId ? this.ticket.assigneeId.toString() : '';
    this.teamInputId = this.ticket?.teamId ? this.ticket.teamId.toString() : '';
    this.assigneeSearchText = this.ticket?.assigneeId ? this.localizationService.instant('ItHelpdesk::Ticket:KeepCurrentAssignee') : '';
    this.teamSearchText = this.ticket?.teamId ? this.localizationService.instant('ItHelpdesk::Ticket:KeepCurrentTeam') : '';
    this.loadRealDataForAssignment();
  }

  closeAssignModal(): void {
    this.isAssignModalOpen = false;
    this.assigneeInputId = '';
    this.teamInputId = '';
    this.assigneeSearchText = '';
    this.teamSearchText = '';
  }

  submitAssign(): void {
    const input = {
      ticketId: this.ticketId,
      assigneeId: this.assigneeInputId ? this.assigneeInputId.trim() : undefined,
      teamId: this.teamInputId ? Number(this.teamInputId) : undefined,
      targetResolutionTime: this.ticket?.targetResolutionTime ? this.ticket.targetResolutionTime : undefined
    };

    this.isSubmitting = true;
    this.ticketService.assignTicket(input).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:AssignSuccess'), 'success');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isSubmitting = false;
        this.closeAssignModal();
      },
      error: (err: any) => {
        this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        this.isSubmitting = false;
      }
    });
  }

  completeTicket(): void {
    this.confirmation.warn(
      this.localizationService.instant('ItHelpdesk::Message:ConfirmComplete'), 
      this.localizationService.instant('ItHelpdesk::Title:ConfirmComplete')
    ).subscribe((status: Confirmation.Status) => {
        if (status === Confirmation.Status.confirm) {
          this.isSubmitting = true;
          this.ticketService.changeStatus({
            ticketId: this.ticketId,
            newStatus: 6,
            comment: this.localizationService.instant('ItHelpdesk::System:TicketCompletedLog')
          }).subscribe({
            next: () => {
              this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CompleteSuccess'), 'success');
              this.loadTicketDetail();
              this.loadTimeline();
              this.isSubmitting = false;
            },
            error: (err: any) => {
              this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
              this.isSubmitting = false;
            }
          });
        }
      });
  }

  closeTicket(): void {
    this.confirmation.warn(
      this.localizationService.instant('ItHelpdesk::Message:ConfirmCloseSpam'), 
      this.localizationService.instant('ItHelpdesk::Title:ConfirmCloseSpam')
    ).subscribe((status: Confirmation.Status) => {
        if (status === Confirmation.Status.confirm) {
          this.isSubmitting = true;
          this.ticketService.changeStatus({
            ticketId: this.ticketId,
            newStatus: 7,
            comment: this.localizationService.instant('ItHelpdesk::System:TicketClosedLog')
          }).subscribe({
            next: () => {
              this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:CloseSuccess'), 'success');
              this.loadTicketDetail();
              this.loadTimeline();
              this.isSubmitting = false;
            },
            error: (err: any) => {
              this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
              this.isSubmitting = false;
            }
          });
        }
      });
  }

  openEditModal(): void {
    this.editData = { title: this.ticket?.title || '', description: this.ticket?.description || '' };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  submitEdit(): void {
    const trimmedTitle = this.editData.title?.trim();
    if (!trimmedTitle) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Detail:ErrorTitleRequired'), 'error');
      return;
    }

    this.isSubmitting = true;
    const updatePayload = { ...this.ticket, title: trimmedTitle, description: this.editData.description };

    this.ticketService.update(this.ticketId, updatePayload as any).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:UpdateSuccess'), 'success');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isEditModalOpen = false;
        this.isSubmitting = false;
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error');
        this.isSubmitting = false;
      }
    });
  }

  openStatusModal(): void {
    this.statusData = { newStatus: (this.ticket?.status ?? 1) as number, comment: '' };
    this.isStatusModalOpen = true;
  }

  closeStatusModal(): void {
    this.isStatusModalOpen = false;
  }

  submitStatusChange(): void {
    this.isSubmitting = true;
    this.ticketService.changeStatus({
      ticketId: this.ticketId,
      newStatus: Number(this.statusData.newStatus),
      comment: this.statusData.comment?.trim()
    }).subscribe({
      next: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Detail:StatusUpdateSuccess'), 'success');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isStatusModalOpen = false;
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::Detail:StatusUpdateError'), 'error');
        this.isSubmitting = false;
      }
    });
  }

  initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = this.localizationService.currentLang === 'en' ? 'en-US' : 'vi-VN';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const formattedText = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        if (this.newCommentContent.trim()) this.newCommentContent += ' ' + formattedText + '. ';
        else this.newCommentContent = formattedText + '. ';
      };

      this.recognition.onerror = () => { this.isRecording = false; };
      this.recognition.onend = () => { this.isRecording = false; };
    }
  }

  toggleRecording(): void {
    if (!this.recognition) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:SpeechNotSupported'), 'error');
      return;
    }
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
        this.isRecording = true;
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Toast:Listening'), 'success');
      } catch (e) { console.error('Mic error:', e); }
    }
  }
}