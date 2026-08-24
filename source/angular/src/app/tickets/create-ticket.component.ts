import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TicketService, CreateUpdateTicketDto } from '@proxy/tickets';
import { CategoryService, CategoryDto } from '@proxy/categories';
import { ServiceService, ServiceDto } from '@proxy/services';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { CoreModule, RestService } from '@abp/ng.core';
import { CustomToastService } from '../shared/services/custom-toast.service';

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

  constructor() {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      categoryId: [null, Validators.required],
      serviceId: [null, Validators.required],
      priorityId: [null, Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
  }

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
            this.customToast.show(`File ${file.name} quá lớn (tối đa 10MB).`, 'error');
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
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      this.customToast.show('Vui lòng điền đầy đủ các trường bắt buộc!', 'error');
      return;
    }

    this.isSubmitting = true;
    const input: CreateUpdateTicketDto = this.ticketForm.value;

    this.ticketService.create(input).subscribe({
      next: (createdTicket: any) => {
        const ticketId = createdTicket?.id;

        // FIX LỖI 500: Chuyển đổi File sang Base64 chuẩn với UploadAttachmentDto
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
                    this.finalizeSuccess();
                  }
                },
                error: (err) => {
                  console.error('Lỗi khi tải file lên:', err);
                  uploadCount++;
                  if (uploadCount === this.selectedFiles.length) {
                    this.finalizeSuccess();
                  }
                }
              });
            };
            reader.onerror = (error) => {
              console.error('Lỗi đọc file:', error);
              uploadCount++;
              if (uploadCount === this.selectedFiles.length) {
                this.finalizeSuccess();
              }
            };
          });
        } else {
          this.finalizeSuccess();
        }
      },
      error: () => {
        this.customToast.show('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  private finalizeSuccess(): void {
    this.customToast.show('Đã gửi yêu cầu hỗ trợ thành công!', 'success');
    this.ticketForm.reset();
    this.selectedFiles = [];
    this.isSubmitting = false;
    this.router.navigate(['/tickets/my-tickets']);
  }
}