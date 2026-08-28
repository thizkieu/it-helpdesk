import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDatatableModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  private restService = inject(RestService);

  filters = {
    filter: '',
    role: null as string | null,
    skipCount: 0,
    maxResultCount: 10
  };

  roles: any[] = [];
  userList: { items: any[], totalCount: number } = { items: [], totalCount: 0 };

  ngOnInit() {
    this.loadRoles();
    this.getUsers();
  }

  // --- HÀM BẮT SỰ KIỆN CHUYỂN TRANG CHỐNG LẶP API ---
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
      next: (res) => {
        this.roles = res.items || res;
      },
      error: (err) => console.error('Lỗi tải danh sách vai trò:', err)
    });
  }

  getUsers() {
    this.restService.request<any, any>({
      method: 'GET',
      url: '/api/app/user', 
      params: {
        filter: this.filters.filter,
        role: this.filters.role,
        skipCount: this.filters.skipCount,
        maxResultCount: this.filters.maxResultCount
      }
    }).subscribe({
      next: (res) => {
        this.userList = res;
      },
      error: (err) => console.error('Lỗi tải danh sách người dùng:', err)
    });
  }

  onFilterChange() {
    this.filters.skipCount = 0; // Reset về trang 1 khi đổi bộ lọc
    this.getUsers();
  }
}