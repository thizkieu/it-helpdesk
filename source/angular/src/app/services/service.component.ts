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

  // Khai báo storageKey riêng cho Service
  protected storageKey = 'service_search_history';

  service = { items: [], totalCount: 0 } as PagedResultDto<ServiceDto>;
  selectedService = {} as ServiceDto;
  form!: FormGroup;
  isModalOpen = false;

  ngOnInit() {
    // BẮT BUỘC: Gọi hàm của Base Component để kích hoạt luồng tìm kiếm tự động
    super.ngOnInit();

    // Dùng this.searchFilter lấy từ BaseComponent
    const streamCreator = (query: any) => this.serviceService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.service = response;
    });
  }

  createService() {
    this.selectedService = {} as ServiceDto;
    this.buildForm();
    this.isModalOpen = true;
  }

  editService(id: string) {
    this.serviceService.get(id).subscribe((data: any) => {
      this.selectedService = data;
      this.buildForm();
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
      code: [this.selectedService.code || '', Validators.required],
      name: [this.selectedService.name || '', Validators.required],
      isActive: [this.selectedService.isActive ?? true],
    });
  }

  save() {
    if (this.form.invalid) return;

    const requestData = this.form.value;
    let request = this.selectedService.id
      ? this.serviceService.update(this.selectedService.id, requestData)
      : this.serviceService.create(requestData);

    request.subscribe(() => {
      this.isModalOpen = false;
      this.form.reset();
      this.list.get();
      this.toaster.success('Lưu dịch vụ thành công!');
    });
  }
}