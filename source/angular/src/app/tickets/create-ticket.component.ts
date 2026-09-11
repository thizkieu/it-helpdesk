import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TicketService, CreateUpdateTicketDto } from '@proxy/tickets';
import { CategoryService, CategoryDto } from '@proxy/categories';
import { ServiceService, ServiceDto } from '@proxy/services';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { CoreModule, RestService, LocalizationService } from '@abp/ng.core';
import { CustomToastService } from '../shared/services/custom-toast.service';

// Custom Validator: Chặn nhập toàn khoảng trắng (Space)
export function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const isWhitespace = (control.value || '').toString().trim().length === 0;
  const isValid = !isWhitespace;
  return isValid ? null : { 'whitespace': true };
}

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CoreModule],
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent implements OnInit {
  ticketForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;

  categories: CategoryDto[] = [];
  services: ServiceDto[] = [];
  priorities: PriorityDto[] = [];

  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private categoryService = inject(CategoryService);
  private serviceService = inject(ServiceService);
  private priorityService = inject(PriorityService);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private router = inject(Router);
  private localizationService = inject(LocalizationService);

  constructor() {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, noWhitespaceValidator, Validators.maxLength(255)]],
      categoryId: [null, Validators.required],
      serviceId: [null, Validators.required],
      priorityId: [null, Validators.required],
      // Đã gỡ bỏ giới hạn độ dài cứng cho phần mô tả theo yêu cầu
      description: ['', [Validators.required, noWhitespaceValidator]]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
  }

  // Getter hỗ trợ đếm số lượng ký tự trực tiếp trên HTML
  get titleLength() { return this.ticketForm.get('title')?.value?.length || 0; }

  loadDropdownData(): void {
    this.categoryService.getList({ maxResultCount: 100 }).subscribe({
      next: (res: any) => this.categories = res?.items || []
    });
    this.serviceService.getList({ maxResultCount: 100 }).subscribe({
      next: (res: any) => this.services = res?.items || []
    });
    this.priorityService.getList({ maxResultCount: 100 }).subscribe({
      next: (res: any) => this.priorities = res?.items || []
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files.item(i);
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            const sizeErrorMsg = this.localizationService.instant('ItHelpdesk::Ticket:FileSizeError', file.name || '');
            this.customToast.show(sizeErrorMsg, 'error');
            continue;
          }
          this.selectedFiles.push(file);
        }
      }
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  submitTicket(): void {
    // Chặn hoàn toàn nếu form chưa hợp lệ hoặc đang xử lý
    if (this.ticketForm.invalid || this.isSubmitting) {
      this.ticketForm.markAllAsTouched();

      const titleControl = this.ticketForm.get('title');
      const descControl = this.ticketForm.get('description');

      // Bắn ra thông báo lỗi minh bạch bằng đa ngôn ngữ nếu User cố tình nhấn nút Gửi (bằng phím Enter hoặc cách nào đó)
      if (titleControl?.hasError('required')) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ErrorTitleEmpty'), 'error');
      } else if (titleControl?.hasError('whitespace')) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ErrorTitleWhitespace'), 'error');
      } else if (titleControl?.hasError('maxlength')) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:TitleMaxLength'), 'error');
      } else if (this.ticketForm.get('categoryId')?.invalid || this.ticketForm.get('serviceId')?.invalid || this.ticketForm.get('priorityId')?.invalid) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ErrorClassificationRequired'), 'error');
      } else if (descControl?.hasError('required')) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ErrorDescriptionEmpty'), 'error');
      } else if (descControl?.hasError('whitespace')) {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ErrorDescriptionWhitespace'), 'error');
      } else {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::FormValidationRequired'), 'error');
      }
      return;
    }

    const titleValue = this.ticketForm.get('title')?.value?.trim() || '';
    const descValue = this.ticketForm.get('description')?.value?.trim() || '';

    this.ticketForm.patchValue({
      title: titleValue,
      description: descValue
    });

    this.isSubmitting = true;
    const input: CreateUpdateTicketDto = this.ticketForm.value;

    this.ticketService.create(input).subscribe({
      next: (createdTicket: any) => {
        const ticketId = createdTicket?.id;

        if (this.selectedFiles.length > 0 && ticketId) {
          let uploadCount = 0;
          this.selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const base64String = (reader.result as string).split(',')[1];

              this.restService.request<any, void>({
                method: 'POST',
                url: `/api/app/ticket/upload-attachment`,
                body: {
                  ticketId: ticketId,
                  fileName: file.name,
                  contentType: file.type || 'application/octet-stream',
                  base64Content: base64String
                }
              }).subscribe({
                next: () => {
                  uploadCount++;
                  if (uploadCount === this.selectedFiles.length) {
                    this.finalizeSuccess(ticketId);
                  }
                },
                error: () => {
                  this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:UploadFileFailed', file.name || ''), 'error');
                  uploadCount++;
                  if (uploadCount === this.selectedFiles.length) {
                    this.finalizeSuccess(ticketId);
                  }
                }
              });
            };
            reader.onerror = () => {
              this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:ReadFileFailed', file.name || ''), 'error');
              uploadCount++;
              if (uploadCount === this.selectedFiles.length) {
                this.finalizeSuccess(ticketId);
              }
            };
          });
        } else {
          this.finalizeSuccess(ticketId);
        }
      },
      error: () => {
        this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:CreateError'), 'error');
        this.isSubmitting = false;
      }
    });
  }
  // Thêm biến cờ báo hiệu vượt quá độ dài
  isTitleLimitReached = false;

  // Thêm hàm xử lý sự kiện khi gõ phím
  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 255) {
      // 1. Chặt đứt phần dư thừa, ép chuỗi về đúng 255 ký tự (đáp ứng "không nhận ký tự 256")
      const truncatedValue = input.value.substring(0, 255);
      this.ticketForm.get('title')?.setValue(truncatedValue);

      // 2. Bật cờ báo lỗi ngay lập tức (đáp ứng "báo lỗi lên luôn")
      this.isTitleLimitReached = true;
    } else {
      // Tắt lỗi nếu họ xóa bớt
      this.isTitleLimitReached = false;
    }
  }
  private finalizeSuccess(ticketId: number): void {
    this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:CreateSuccess'), 'success');
    this.ticketForm.reset();
    this.selectedFiles = [];
    this.isSubmitting = false;

    this.router.navigate(['/tickets/detail', ticketId], { queryParams: { returnUrl: '/tickets/my-tickets' } });
  }
}