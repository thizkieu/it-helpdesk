import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TicketService, CreateUpdateTicketDto } from '@proxy/tickets'; 
import { CategoryService, CategoryDto } from '@proxy/categories';
import { ServiceService, ServiceDto } from '@proxy/services';
import { PriorityService, PriorityDto } from '@proxy/priorities';
import { ToasterService } from '@abp/ng.theme.shared';
import { CoreModule } from '@abp/ng.core';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CoreModule],
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

  // Dùng inject() để tránh lỗi NG2003
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private categoryService = inject(CategoryService);
  private serviceService = inject(ServiceService);
  private priorityService = inject(PriorityService);
  private toaster = inject(ToasterService);

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
    this.categoryService.getList({ maxResultCount: 100 }).subscribe((res: any) => this.categories = res.items);
    this.serviceService.getList({ maxResultCount: 100 }).subscribe((res: any) => this.services = res.items);
    this.priorityService.getList({ maxResultCount: 100 }).subscribe((res: any) => this.priorities = res.items);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files.item(i)!);
      }
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  submitTicket(): void {
    if (this.ticketForm.invalid) return;

    this.isSubmitting = true;
    const input: CreateUpdateTicketDto = this.ticketForm.value;

    this.ticketService.create(input).subscribe({
      next: () => {
        this.toaster.success('Đã gửi yêu cầu hỗ trợ thành công!', 'Tuyệt vời');
        this.ticketForm.reset();
        this.selectedFiles = [];
        this.isSubmitting = false;
      },
      error: () => {
        this.toaster.error('Không thể gửi yêu cầu lúc này.', 'Lỗi');
        this.isSubmitting = false;
      }
    });
  }
}