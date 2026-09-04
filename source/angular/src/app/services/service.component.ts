import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

import { ServiceDto, ServiceService } from '../proxy/services';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxDatatableModule,
    NgbDropdownModule,
    ModalComponent,
    AutofocusDirective,
    NgxDatatableListDirective,
    NgxDatatableDefaultDirective,
    PermissionDirective,
    ModalCloseDirective,
    LocalizationPipe
  ],
  providers: [ListService],
})
export class ServiceComponent extends AdminBaseComponent implements OnInit {
  private serviceService = inject(ServiceService) as any;
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);

  protected storageKey = 'service_search_history';

  service = { items: [], totalCount: 0 } as PagedResultDto<ServiceDto>;
  selectedService = {} as ServiceDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false; // BỔ SUNG BIẾN CHỐNG DOUBLE-SUBMIT

  ngOnInit() {
    super.ngOnInit();

    const streamCreator = (query: any) => this.serviceService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.service = response;
    });
  }

  createService() {
    this.selectedService = {} as ServiceDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  editService(id: string) {
    this.serviceService.get(id).subscribe((data: any) => {
      this.selectedService = data;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
    });
  }

  delete(id: string, name: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => {
      if (status === Confirmation.Status.confirm) {
        this.serviceService.delete(id).subscribe(() => {
          this.list.get();
          this.toaster.success('Xóa dịch vụ thành công!');
        });
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      code: [this.selectedService.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedService.name || '', [Validators.required, Validators.maxLength(255)]],
      isActive: [this.selectedService.isActive ?? true],
    });
  }

  save() {
    // CHẶN KHOẢNG TRẮNG TÀNG HÌNH (WHITESPACE VALIDATION)
    const codeVal = this.form.get('code')?.value?.trim() || '';
    const nameVal = this.form.get('name')?.value?.trim() || '';

    if (this.form.invalid || !codeVal || !nameVal || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.toaster.error('Vui lòng điền đầy đủ thông tin (không được để trống hoặc toàn khoảng trắng)!');
      return;
    }

    this.isSubmitting = true; // KHÓA NÚT NGAY LẬP TỨC

    const requestData = {
      ...this.form.value,
      code: codeVal,
      name: nameVal
    };

    let request = this.selectedService.id
      ? this.serviceService.update(this.selectedService.id, requestData)
      : this.serviceService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false; // MỞ KHÓA NÚT
        this.list.get();
        this.toaster.success('Lưu dịch vụ thành công!');
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu dịch vụ:', err);
        this.toaster.error('Không thể lưu lúc này. Vui lòng thử lại!');
        this.isSubmitting = false; // MỞ KHÓA NÚT KHI GẶP LỖI
      }
    });
  }
}