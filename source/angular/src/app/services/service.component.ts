import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, DatatableComponent } from '@swimlane/ngx-datatable';
import { BehaviorSubject } from 'rxjs';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

// Import từ proxy - Nhớ kiểm tra đường dẫn này có đúng với cấu trúc thư mục của bạn không nhé
import { ServiceDto, ServiceService } from '../proxy/services';

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
export class ServiceComponent implements OnInit {
  public readonly list = inject(ListService);
  // Ép kiểu 'as any' để tạm thời bỏ qua lỗi check kiểu TS nếu proxy chưa gen chuẩn
  private serviceService = inject(ServiceService) as any; 
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);

  service = { items: [], totalCount: 0 } as PagedResultDto<ServiceDto>;
  selectedService = {} as ServiceDto;
  form!: FormGroup;
  isModalOpen = false;

  // 1. Khởi tạo luồng tìm kiếm
  search$ = new BehaviorSubject<string>('');

  // 2. Lấy tham chiếu của bảng để cập nhật UI khi resize
  @ViewChild(DatatableComponent) table!: DatatableComponent;

  // 3. Lắng nghe sự kiện thu phóng trình duyệt
  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.table) {
      this.table.recalculate(); // Ép bảng tính toán lại độ rộng cột
    }
  }

  ngOnInit() {
    // 4. Hook ListService vào API getList kết hợp biến tìm kiếm
    const streamCreator = (query: any) => this.serviceService.getList({ ...query, filter: this.search$.value });
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
    // Gọi API lấy chi tiết dịch vụ
    this.serviceService.get(id).subscribe((data: any) => { 
      this.selectedService = data;
      this.buildForm();
      this.isModalOpen = true;
    });
  }

  delete(id: string, name: string) {
    // Hiển thị modal xác nhận xóa
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => { 
      if (status === Confirmation.Status.confirm) {
        this.serviceService.delete(id).subscribe(() => {
          this.list.get(); // Reload lại danh sách
          this.toaster.success('Xóa dịch vụ thành công!');
        });
      }
    });
  }

  buildForm() {
    // Khởi tạo FormGroup với các validator
    this.form = this.fb.group({
      code: [this.selectedService.code || '', Validators.required],
      name: [this.selectedService.name || '', Validators.required],
      isActive: [this.selectedService.isActive ?? true],
    });
  }

  save() {
    if (this.form.invalid) return; // Nếu form lỗi thì không lưu

    const requestData = this.form.value;
    // Xác định gọi API create hay update dựa vào việc có ID hay chưa
    let request = this.selectedService.id
      ? this.serviceService.update(this.selectedService.id, requestData)
      : this.serviceService.create(requestData);

    request.subscribe(() => {
      this.isModalOpen = false; // Đóng modal
      this.form.reset(); // Reset form
      this.list.get(); // Reload danh sách
      this.toaster.success('Lưu dịch vụ thành công!');
    });
  }
}