import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService, LocalizationService, LocalizationPipe } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CustomToastService } from '../shared/services/custom-toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDatatableModule, LocalizationPipe, ThemeSharedModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private confirmation = inject(ConfirmationService);
  public localizationService = inject(LocalizationService);

  filters = {
    filter: '',
    role: null as string | null,
    skipCount: 0,
    maxResultCount: 10
  };

  roles: any[] = [];
  userList: { items: any[], totalCount: number } = { items: [], totalCount: 0 };
  isLoading = false;
  isSubmitting = false;

  isUserModalOpen = false;
  isEditing = false;
  userForm: any = {
    id: null,
    userName: '',
    email: '',
    name: '',
    surname: '',
    phoneNumber: '',
    password: '',
    isActive: true,
    lockoutEnabled: true,
    concurrencyStamp: '', 
    roleNames: []
  };

  ngOnInit() {
    this.loadRoles();
    this.getUsers();
  }

  onPageChange(event: any): void {
    const newSkipCount = event.offset * this.filters.maxResultCount;
    if (this.filters.skipCount !== newSkipCount) {
      this.filters.skipCount = newSkipCount;
      this.getUsers();
    }
  }

  loadRoles() {
    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/identity/roles'
    }).subscribe({
      next: (res: any) => {
        this.roles = res.items || res;
      },
      error: (err: any) => console.error(this.localizationService.instant('ItHelpdesk::Users:ErrorLoadRoles'), err)
    });
  }

  // CƠ CHẾ MỚI ĐÃ ĐƯỢC NÂNG CẤP: Nhường toàn bộ việc xử lý dữ liệu cho Backend
  getUsers() {
    this.isLoading = true;

    // Chuẩn bị tham số truy vấn truyền xuống Backend
    const queryParams: any = { 
      skipCount: this.filters.skipCount,
      maxResultCount: this.filters.maxResultCount
    };

    if (this.filters.filter && this.filters.filter.trim() !== '') {
      queryParams.filter = this.filters.filter.trim();
    }

    if (this.filters.role) {
      queryParams.roleId = this.filters.role; // Gửi RoleId lên để C# lọc bằng LINQ
    }

    // GỌI TỚI API CỦA EXTENDED USER APPSERVICE (Auto-API của ABP)
    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/app/extended-user', 
      params: queryParams
    }).subscribe({
      next: (res: any) => {
        // Backend C# giờ đã trả về trực tiếp DTO có sẵn danh sách RoleNames và đã phân trang chuẩn
        this.userList.items = res.items || [];
        this.userList.totalCount = res.totalCount || 0;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.extractAndShowError(err, 'ItHelpdesk::Users:ErrorLoadUsers');
        this.isLoading = false;
      }
    });
  }

  onFilterChange() {
    this.filters.skipCount = 0;
    this.getUsers();
  }

  toggleRole(roleName: string) {
    if (!this.userForm.roleNames) this.userForm.roleNames = [];
    const index = this.userForm.roleNames.indexOf(roleName);
    if (index > -1) {
      this.userForm.roleNames.splice(index, 1);
    } else {
      this.userForm.roleNames.push(roleName);
    }
  }

  hasRole(roleName: string): boolean {
    return this.userForm.roleNames?.includes(roleName) || false;
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.userForm = {
      id: null,
      userName: '',
      email: '',
      name: '',
      surname: '',
      phoneNumber: '',
      password: '',
      isActive: true,
      lockoutEnabled: true,
      concurrencyStamp: '',
      roleNames: []
    };
    this.isUserModalOpen = true;
  }

  openEditModal(user: any): void {
    this.isEditing = true;
    this.isLoading = true;

    // Vẫn gọi API Identity mặc định để lấy ConcurrencyStamp (tránh lỗi xung đột ghi dữ liệu)
    this.restService.request<any, any>({
      method: 'GET',
      url: `/api/identity/users/${user.id}`
    }).subscribe({
      next: (fullUser: any) => {
        this.userForm = {
          id: fullUser.id,
          userName: fullUser.userName,
          email: fullUser.email,
          name: fullUser.name || '',
          surname: fullUser.surname || '',
          phoneNumber: fullUser.phoneNumber || '',
          isActive: fullUser.isActive,
          lockoutEnabled: fullUser.lockoutEnabled !== undefined ? fullUser.lockoutEnabled : true,
          concurrencyStamp: fullUser.concurrencyStamp,
          // Tái sử dụng roleNames đã được Backend Extended ghép sẵn hiển thị ở bảng Grid
          roleNames: user.roleNames ? [...user.roleNames] : []
        };
        this.isLoading = false;
        this.isUserModalOpen = true;
      },
      error: (err: any) => {
        this.extractAndShowError(err);
        this.isLoading = false;
      }
    });
  }

  closeUserModal(): void {
    this.isUserModalOpen = false;
  }

  saveUser(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.userForm.userName?.trim()) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ErrorUsernameRequired'), 'error');
      return;
    }
    if (!this.userForm.email?.trim() || !emailRegex.test(this.userForm.email)) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ErrorEmailInvalid'), 'error');
      return;
    }
    if (!this.isEditing && (!this.userForm.password || this.userForm.password.trim().length < 6)) {
      this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ErrorPasswordInvalid'), 'error');
      return;
    }

    this.isSubmitting = true;

    // Giữ nguyên API của ABP Identity Module cho chức năng Thêm/Sửa (CRUD)
    const payload = {
      userName: this.userForm.userName,
      email: this.userForm.email,
      name: this.userForm.name,
      surname: this.userForm.surname,
      phoneNumber: this.userForm.phoneNumber,
      isActive: this.userForm.isActive,
      lockoutEnabled: this.userForm.lockoutEnabled,
      roleNames: this.userForm.roleNames,
      concurrencyStamp: this.userForm.concurrencyStamp,
      password: this.userForm.password || undefined 
    };

    const request$ = this.isEditing
      ? this.restService.request<any, any>({ method: 'PUT', url: `/api/identity/users/${this.userForm.id}`, body: payload })
      : this.restService.request<any, any>({ method: 'POST', url: '/api/identity/users', body: payload });

    request$.subscribe({
      next: () => {
        const msg = this.isEditing 
          ? this.localizationService.instant('ItHelpdesk::Users:ToastUpdateSuccess') 
          : this.localizationService.instant('ItHelpdesk::Users:ToastCreateSuccess');
        this.customToast.show(msg, 'success');
        this.closeUserModal();
        this.getUsers(); 
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.extractAndShowError(err);
        this.isSubmitting = false;
      }
    });
  }

  toggleUserStatus(user: any): void {
    const actionText = user.isActive 
      ? this.localizationService.instant('ItHelpdesk::Users:ActionLock') 
      : this.localizationService.instant('ItHelpdesk::Users:ActionUnlock');
    
    const confirmMsg = this.localizationService.instant('ItHelpdesk::Users:ConfirmStatusMsg', user.userName || '');
    const confirmTitle = this.localizationService.instant('ItHelpdesk::Users:ConfirmStatusTitle');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.restService.request<any, any>({ method: 'GET', url: `/api/identity/users/${user.id}` }).subscribe({
          next: (fullUser: any) => {
            const updated = { 
              ...fullUser, 
              isActive: !user.isActive, 
              roleNames: user.roleNames 
            };
            this.restService.request<any, any>({
              method: 'PUT',
              url: `/api/identity/users/${user.id}`,
              body: updated
            }).subscribe({
              next: () => {
                this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastStatusSuccess', actionText), 'success');
                this.getUsers();
              },
              error: (err: any) => this.extractAndShowError(err, 'ItHelpdesk::Users:ErrorStatusChange')
            });
          },
          error: (err: any) => this.extractAndShowError(err)
        });
      }
    });
  }

  deleteUser(user: any): void {
    const confirmMsg = this.localizationService.instant('ItHelpdesk::Users:ConfirmDeleteMsg', user.userName || '');
    const confirmTitle = this.localizationService.instant('ItHelpdesk::Users:ConfirmDeleteTitle');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.restService.request<any, any>({
          method: 'DELETE',
          url: `/api/identity/users/${user.id}`
        }).subscribe({
          next: () => {
            this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastDeleteSuccess'), 'success');
            this.getUsers();
          },
          error: (err: any) => this.extractAndShowError(err, 'ItHelpdesk::Users:ErrorDelete')
        });
      }
    });
  }

  private extractAndShowError(err: any, fallbackKey: string = 'ItHelpdesk::Error:Generic'): void {
    const errorObj = err?.error?.error || err?.error || err;
    let msg = errorObj?.details || errorObj?.message;
    
    if (!msg && errorObj?.validationErrors?.length > 0) {
      msg = errorObj.validationErrors.map((e: any) => e.message).join(', ');
    }
    
    msg = msg || this.localizationService.instant(fallbackKey);
    this.customToast.show(msg, 'error');
  }
}