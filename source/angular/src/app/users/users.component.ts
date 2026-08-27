import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService } from '@abp/ng.core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule, NgxDatatableModule],
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
    private restService = inject(RestService);

    // Bộ lọc gửi lên Backend
    filters = {
        filter: '',
        role: null as string | null,
        skipCount: 0,
        maxResultCount: 10
    };

    roles: any[] = []; // Danh sách vai trò dùng cho ô Select
    userList: { items: any[], totalCount: number } = { items: [], totalCount: 0 };

    ngOnInit() {
        this.loadRoles();
        this.getUsers();
    }

    // 1. Tải danh sách các Role hệ thống
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

    // 2. Tải danh sách User kèm điều kiện lọc từ khóa và Role
    getUsers() {
        this.restService.request<any, any>({
            method: 'GET',
            url: '/api/app/user', // Trỏ thẳng tới UserAppService ta vừa tạo ở backend
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

    // Khi thay đổi dropdown vai trò, tự động reset phân trang và tải lại dữ liệu
    onFilterChange() {
        this.filters.skipCount = 0;
        this.getUsers();
    }
}