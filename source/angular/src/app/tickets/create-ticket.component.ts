import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TicketService, CreateUpdateTicketDto } from '@proxy/tickets';
import { CategoryService, CategoryDto } from '@proxy/categories';
import { ServiceService, ServiceDto } from '@proxy/services';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { CoreModule, RestService, LocalizationService } from '@abp/ng.core';
import { CustomToastService } from '../shared/services/custom-toast.service';

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

  parentTicketId: number | null = null;
  parentTicketNo: string = '';
  isTitleLimitReached = false;

  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private categoryService = inject(CategoryService);
  private serviceService = inject(ServiceService);
  private priorityService = inject(PriorityService);
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private localizationService = inject(LocalizationService);

  constructor() {
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, noWhitespaceValidator, Validators.maxLength(255)]],
      categoryId: [null, Validators.required],
      serviceId: [null, Validators.required],
      priorityId: [null, Validators.required],
      description: ['', [Validators.required, noWhitespaceValidator]],
      parentTicketId: [null]
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();

    this.route.queryParams.subscribe(params => {
      if (params['refTicketId']) {
        this.parentTicketId = Number(params['refTicketId']);
        this.loadOldTicketData(this.parentTicketId);
      }
    });
  }

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

  loadOldTicketData(id: number): void {
    this.ticketService.get(id).subscribe({
      next: (oldTicket) => {
        this.parentTicketNo = oldTicket.ticketNo || '';
        const titlePrefix = this.localizationService.instant('ItHelpdesk::Ticket:FollowUpTitlePrefix');
        const descPrefix = this.localizationService.instant('ItHelpdesk::Ticket:FollowUpDescPrefix', oldTicket.ticketNo || '');

        let truncatedTitle = `${titlePrefix} ${oldTicket.title}`;
        if (truncatedTitle.length > 255) {
          truncatedTitle = truncatedTitle.substring(0, 255);
        }

        this.ticketForm.patchValue({
          title: truncatedTitle,
          categoryId: oldTicket.categoryId,
          serviceId: oldTicket.serviceId,
          priorityId: oldTicket.priorityId,
          parentTicketId: oldTicket.id,
          description: `${descPrefix}\n\n`
        });
      },
      error: () => {
        console.error(this.localizationService.instant('ItHelpdesk::Error:LoadDetailFailed'));
      }
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

  onTitleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > 255) {
      const truncatedValue = input.value.substring(0, 255);
      this.ticketForm.get('title')?.setValue(truncatedValue);
      this.isTitleLimitReached = true;
    } else {
      this.isTitleLimitReached = false;
    }
  }

  submitTicket(): void {
    if (this.ticketForm.invalid || this.isSubmitting) {
      this.ticketForm.markAllAsTouched();
      this.customToast.show(this.localizationService.instant('ItHelpdesk::FormValidationRequired'), 'error');
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

  private finalizeSuccess(ticketId: number): void {
    this.customToast.show(this.localizationService.instant('ItHelpdesk::Ticket:CreateSuccess'), 'success');
    this.ticketForm.reset();
    this.selectedFiles = [];
    this.isSubmitting = false;

    this.router.navigate(['/tickets/detail', ticketId], { queryParams: { returnUrl: '/tickets/my-tickets' } });
  }
}