import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule, DatatableComponent } from '@swimlane/ngx-datatable';
import { BehaviorSubject } from 'rxjs';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

// Import các DTO và Service từ proxy được gen bởi ABP CLI
import { TeamDto, TeamService } from '../proxy/teams';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
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
  providers: [ListService], // Provider ListService riêng cho component này để quản lý query danh sách
})
export class TeamComponent implements OnInit {
  // Inject các dịch vụ cần thiết
  public readonly list = inject(ListService);
  // Dùng 'as any' nếu proxy gen ra kiểu dữ liệu chưa hoàn toàn khớp để TS không báo lỗi
  private teamService = inject(TeamService) as any; 
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);

  // Biến chứa dữ liệu danh sách
  team = { items: [], totalCount: 0 } as PagedResultDto<TeamDto>;
  // Biến chứa dữ liệu của nhóm đang được chọn để tạo mới/chỉnh sửa
  selectedTeam = {} as TeamDto;
  // Reactive Form
  form!: FormGroup;
  // Trạng thái đóng/mở Modal
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
    // 4. Khởi tạo luồng truy vấn dữ liệu có kèm Search
    const streamCreator = (query: any) => this.teamService.getList({ ...query, filter: this.search$.value });
    
    // Hook ListService vào luồng truy vấn và subscribe để nhận dữ liệu khi có thay đổi
    this.list.hookToQuery(streamCreator).subscribe((response: any) => { 
      this.team = response;
    });
  }

  // Khởi tạo dữ liệu và mở Modal tạo mới
  createTeam() {
    this.selectedTeam = {} as TeamDto; // Reset dữ liệu được chọn
    this.buildForm(); // Xây dựng form trống
    this.isModalOpen = true; // Mở modal
  }

  // Lấy dữ liệu chi tiết và mở Modal chỉnh sửa
  editTeam(id: string) { 
    // Gọi API lấy chi tiết nhóm theo ID
    this.teamService.get(id).subscribe((data: any) => { 
      this.selectedTeam = data;
      this.buildForm(); // Xây dựng form với dữ liệu đã lấy
      this.isModalOpen = true; // Mở modal
    });
  }

  // Xử lý xóa nhóm
  delete(id: string, name: string) {
    // Hiển thị modal xác nhận xóa của ABP Theme Shared
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => { 
      if (status === Confirmation.Status.confirm) {
        // Nếu xác nhận, gọi API xóa
        this.teamService.delete(id).subscribe(() => {
          this.list.get(); // Reload lại danh sách sau khi xóa thành công
          this.toaster.success('Xóa nhóm hỗ trợ thành công!');
        });
      }
    });
  }

  // Hàm helper xây dựng Reactive Form
  buildForm() {
    this.form = this.fb.group({
      code: [this.selectedTeam.code || '', Validators.required], // Mã nhóm: Bắt buộc
      name: [this.selectedTeam.name || '', Validators.required], // Tên nhóm: Bắt buộc
      isActive: [this.selectedTeam.isActive ?? true], // Trạng thái: Mặc định là Active (true)
    });
  }

  // Xử lý lưu dữ liệu (Tạo mới hoặc Cập nhật)
  save() {
    if (this.form.invalid) return; // Nếu form không hợp lệ thì dừng lại

    const requestData = this.form.value;
    // Xác định gọi API create hay update dựa vào việc đã có ID (chỉnh sửa) hay chưa (tạo mới)
    let request = this.selectedTeam.id
      ? this.teamService.update(this.selectedTeam.id, requestData)
      : this.teamService.create(requestData);

    // Thực thi request API
    request.subscribe(() => {
      this.isModalOpen = false; // Đóng modal
      this.form.reset(); // Reset lại form
      this.list.get(); // Reload danh sách để cập nhật dữ liệu mới
      this.toaster.success('Lưu nhóm hỗ trợ thành công!');
    });
  }
}