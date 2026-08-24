import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketDto, TicketTimelineDto } from '@proxy/tickets';
import { CoreModule, RestService } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { CustomToastService } from '../shared/services/custom-toast.service';

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
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private confirmation = inject(ConfirmationService);

  ticketId: number = 0;
  ticket: TicketDto | null = null;
  timeline: any[] = [];
  newCommentContent: string = '';

  selectedFileName: string | null = null;

  isLoading = true;
  isSubmitting = false;

  isAssignModalOpen: boolean = false;
  assigneeInputId: string = '';
  teamInputId: string = '';

  assigneeSearchText: string = '';
  teamSearchText: string = '';

  allTechnicians: any[] = [];
  filteredTechnicians: any[] = [];
  recentTechnicians: any[] = [];
  showTechDropdown: boolean = false;

  allTeams: any[] = [];
  filteredTeams: any[] = [];
  showTeamDropdown: boolean = false;

  isEditModalOpen: boolean = false;
  editData = { title: '', description: '' };

  isRecording: boolean = false;
  recognition: any;

  attachments: any[] = [];

  quickReplies: string[] = [
    '👍 IT đã tiếp nhận và đang xử lý.',
    '📸 Vui lòng cung cấp thêm ảnh chụp màn hình lỗi.',
    '✅ Đã xử lý xong, anh/chị kiểm tra lại giúp IT nhé.',
    '⏳ Hệ thống đang bảo trì, vui lòng quay lại sau.'
  ];

  applyQuickReply(reply: string): void {
    if (this.newCommentContent.trim()) {
      this.newCommentContent += ' ' + reply;
    } else {
      this.newCommentContent = reply;
    }
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.ticketId = Number(idParam);
      this.loadTicketDetail();
      this.loadTimeline();
    }

    const savedHistory = localStorage.getItem('it_recent_assignees');
    if (savedHistory) {
      this.recentTechnicians = JSON.parse(savedHistory);
    }

    this.initSpeechRecognition();
  }

  loadTicketDetail(): void {
    this.isLoading = true;
    this.ticketService.get(this.ticketId).subscribe({
      next: (res: TicketDto) => {
        this.ticket = res;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Lỗi khi tải chi tiết Ticket:', err);
        this.customToast.show('Không thể tải chi tiết yêu cầu hỗ trợ!', 'error');
        this.isLoading = false;
      }
    });
  }

  loadTimeline(): void {
    this.ticketService.getTimeline(this.ticketId).subscribe({
      next: (res: TicketTimelineDto[]) => {
        this.timeline = res || [];

        // GỌI ĐÚNG ĐƯỜNG DẪN TUYỆT ĐỐI KHỚP VỚI C#
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
              if (item.type === 'Activity' && item.content && item.content.includes('Đã đính kèm tệp:')) {
                const fileName = item.content.replace('Đã đính kèm tệp:', '').trim();
                const found = this.attachments.find(a => a.name === fileName);
                if (found) {
                  item.attachmentUrl = found.url;
                  item.attachmentType = found.type;
                }
              }
            });
          },
          error: (e) => console.error('Lỗi tải hình ảnh:', e)
        });

      },
      error: (err: unknown) => {
        console.error('Lỗi khi tải lịch sử timeline:', err);
      }
    });
  }

  loadRealDataForAssignment(): void {
    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/identity/users?maxResultCount=100'
    }).subscribe({
      next: (res) => {
        const users = res.items || res || [];
        this.allTechnicians = users.map((u: any) => ({
          id: u.id,
          name: `${u.surname || ''} ${u.name || u.userName}`.trim(),
          email: u.email,
          isActive: u.isActive !== false
        }));
        this.filteredTechnicians = [...this.allTechnicians];
      },
      error: (err) => {
        console.error('Không thể tải danh sách kỹ thuật viên:', err);
        this.customToast.show('Không thể tải danh sách nhân sự!', 'error');
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
      },
      error: (err) => {
        console.error('Không thể tải danh sách nhóm:', err);
      }
    });
  }

  onSearchTechnician(keyword: string): void {
    this.assigneeSearchText = keyword;
    const lower = keyword.toLowerCase();
    this.filteredTechnicians = this.allTechnicians.filter(
      (x: any) => x.isActive && (x.name?.toLowerCase().includes(lower) || x.email?.toLowerCase().includes(lower))
    );
    this.showTechDropdown = true;
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
    this.showTeamDropdown = true;
  }

  selectTeam(team: any): void {
    this.teamInputId = team.id;
    this.teamSearchText = team.name;
    this.showTeamDropdown = false;
  }

  sendComment(): void {
    if (!this.newCommentContent || !this.newCommentContent.trim() || this.isSubmitting) return;

    this.isSubmitting = true;

    this.ticketService.addComment(this.ticketId, this.newCommentContent, false).subscribe({
      next: () => {
        this.customToast.show('Đã gửi phản hồi thành công!', 'success');
        this.newCommentContent = '';
        this.isSubmitting = false;
        this.loadTimeline();
      },
      error: (err: unknown) => {
        console.error('Lỗi khi gửi bình luận:', err);
        const errorObj = err as any;
        this.customToast.show(errorObj?.error?.message || 'Không thể gửi bình luận lúc này!', 'error');
        this.isSubmitting = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.customToast.show('File quá lớn! Vui lòng chọn file dưới 10MB.', 'error');
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
        body: {
          ticketId: this.ticketId,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          base64Content: base64String
        }
      }).subscribe({
        next: () => {
          this.customToast.show('Tải tệp đính kèm lên thành công!', 'success');
          this.loadTimeline();
          this.isSubmitting = false;
          setTimeout(() => {
            this.selectedFileName = null;
          }, 3000);
        },
        error: (err: unknown) => {
          console.error('Lỗi upload:', err);
          this.customToast.show('Upload thất bại, có lỗi xảy ra!', 'error');
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

    if (targetDate < now) {
      return 'overdue';
    } else if (diffHours <= 2) {
      return 'warning';
    }

    return 'normal';
  }

  openAssignModal(): void {
    this.isAssignModalOpen = true;
    this.loadRealDataForAssignment();
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
        this.customToast.show('Phân công xử lý vé thành công!', 'success');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isSubmitting = false;
        this.assigneeInputId = '';
        this.teamInputId = '';
        this.assigneeSearchText = '';
        this.teamSearchText = '';
        this.isAssignModalOpen = false;
      },
      error: (err: unknown) => {
        console.error('Lỗi phân công:', err);
        const errorObj = err as any;
        this.customToast.show(errorObj?.error?.message || 'Phân công thất bại, vui lòng kiểm tra lại!', 'error');
        this.isSubmitting = false;
      }
    });
  }

  closeTicket(): void {
    this.confirmation.warn('Bạn có chắc chắn muốn đóng yêu cầu này không?', 'Xác nhận đóng vé')
      .subscribe((status: Confirmation.Status) => {
        if (status === Confirmation.Status.confirm) {
          this.isSubmitting = true;

          const updatePayload = {
            ...this.ticket,
            status: 3
          };

          this.ticketService.update(this.ticketId, updatePayload as any).subscribe({
            next: () => {
              this.customToast.show('Đã đóng yêu cầu thành công!', 'success');
              this.loadTicketDetail();
              this.loadTimeline();
              this.isSubmitting = false;
            },
            error: (err: unknown) => {
              console.error('Lỗi đóng vé:', err);
              this.customToast.show('Đóng yêu cầu thất bại. Vui lòng thử lại!', 'error');
              this.isSubmitting = false;
            }
          });
        }
      });
  }

  openEditModal(): void {
    this.editData = {
      title: this.ticket?.title || '',
      description: this.ticket?.description || ''
    };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
  }

  submitEdit(): void {
    if (!this.editData.title.trim()) {
      this.customToast.show('Vui lòng không để trống tiêu đề!', 'error');
      return;
    }

    this.isSubmitting = true;
    const updatePayload = {
      ...this.ticket,
      title: this.editData.title,
      description: this.editData.description
    };

    this.ticketService.update(this.ticketId, updatePayload as any).subscribe({
      next: () => {
        this.customToast.show('Cập nhật yêu cầu thành công!', 'success');
        this.loadTicketDetail();
        this.loadTimeline();
        this.isEditModalOpen = false;
        this.isSubmitting = false;
      },
      error: (err: unknown) => {
        console.error('Lỗi cập nhật:', err);
        this.customToast.show('Cập nhật thất bại. Vui lòng kiểm tra lại!', 'error');
        this.isSubmitting = false;
      }
    });
  }

  initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'vi-VN';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const formattedText = transcript.charAt(0).toUpperCase() + transcript.slice(1);

        if (this.newCommentContent.trim()) {
          this.newCommentContent += ' ' + formattedText + '. ';
        } else {
          this.newCommentContent = formattedText + '. ';
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Lỗi nhận diện giọng nói:', event.error);
        this.isRecording = false;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };
    }
  }

  toggleRecording(): void {
    if (!this.recognition) {
      this.customToast.show('Trình duyệt không hỗ trợ Web Speech API.', 'error');
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
        this.isRecording = true;
        this.customToast.show('Đang nghe... Hãy nói vào Micro!', 'success');
      } catch (e) {
        console.error('Lỗi khi bật mic:', e);
      }
    }
  }
}