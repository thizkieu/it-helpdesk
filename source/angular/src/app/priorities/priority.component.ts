import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

import { PriorityDto, PriorityService } from '../proxy/priorities';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-priority',
  templateUrl: './priority.component.html',
  styleUrls: ['./priority.component.scss'],
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
export class PriorityComponent extends AdminBaseComponent implements OnInit {
  private priorityService = inject(PriorityService) as any;
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);

  protected storageKey = 'priority_search_history';

  priority = { items: [], totalCount: 0 } as PagedResultDto<PriorityDto>;
  selectedPriority = {} as PriorityDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false; // BỔ SUNG BIẾN CHỐNG DOUBLE-SUBMIT

  ngOnInit() {
    super.ngOnInit();

    const streamCreator = (query: any) => this.priorityService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.priority = response;
    });
  }

  createPriority() {
    this.selectedPriority = {} as PriorityDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  editPriority(id: string) {
    this.priorityService.get(id).subscribe((data: any) => {
      this.selectedPriority = data;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
    });
  }

  delete(id: string, name: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => {
      if (status === Confirmation.Status.confirm) {
        this.priorityService.delete(id).subscribe(() => {
          this.list.get();
          this.toaster.success('Xóa độ ưu tiên thành công!');
        });
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      code: [this.selectedPriority.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedPriority.name || '', [Validators.required, Validators.maxLength(100)]],
      isActive: [this.selectedPriority.isActive ?? true],
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

    let request = this.selectedPriority.id
      ? this.priorityService.update(this.selectedPriority.id, requestData)
      : this.priorityService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false; // MỞ KHÓA NÚT
        this.list.get();
        this.toaster.success('Lưu độ ưu tiên thành công!');
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu độ ưu tiên:', err);
        this.toaster.error('Không thể lưu lúc này. Vui lòng thử lại!');
        this.isSubmitting = false; // MỞ KHÓA NÚT KHI GẶP LỖI
      }
    });
  }
}