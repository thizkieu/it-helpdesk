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

  ngOnInit() {
    // BẮT BUỘC: Gọi hàm của Base Component để kích hoạt luồng tìm kiếm tự động
    super.ngOnInit();

    // Dùng this.searchFilter thay vì this.search$.value
    const streamCreator = (query: any) => this.priorityService.getList({ ...query, filter: this.searchFilter });
    
    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.priority = response;
    });
  }

  createPriority() {
    this.selectedPriority = {} as PriorityDto;
    this.buildForm();
    this.isModalOpen = true;
  }

  editPriority(id: string) {
    this.priorityService.get(id).subscribe((data: any) => {
      this.selectedPriority = data;
      this.buildForm();
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
      code: [this.selectedPriority.code || '', Validators.required],
      name: [this.selectedPriority.name || '', Validators.required],
      isActive: [this.selectedPriority.isActive ?? true],
    });
  }

  save() {
    if (this.form.invalid) return;
    const requestData = this.form.value;
    let request = this.selectedPriority.id
      ? this.priorityService.update(this.selectedPriority.id, requestData)
      : this.priorityService.create(requestData);

    request.subscribe(() => {
      this.isModalOpen = false;
      this.form.reset();
      this.list.get();
      this.toaster.success('Lưu độ ưu tiên thành công!');
    });
  }
}