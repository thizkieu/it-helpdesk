import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {
  ListService,
  PagedResultDto,
  LocalizationPipe,
  PermissionDirective,
  AutofocusDirective
} from '@abp/ng.core';
import {
  ConfirmationService,
  Confirmation,
  NgxDatatableDefaultDirective,
  NgxDatatableListDirective,
  ModalCloseDirective,
  ModalComponent,
  ToasterService
} from '@abp/ng.theme.shared';

import { CategoryDto, CategoryService } from '../proxy/categories';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
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
export class CategoryComponent extends AdminBaseComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);

  protected storageKey = 'category_search_history';

  category = { items: [], totalCount: 0 } as PagedResultDto<CategoryDto>;
  selectedCategory = {} as CategoryDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false; // BỔ SUNG BIẾN CHỐNG DOUBLE-SUBMIT

  parentCategories: CategoryDto[] = [];
  teams: { id: string; name: string }[] = [
    { id: 'team-1', name: 'IT Support L1' },
    { id: 'team-2', name: 'Infrastructure Team' },
    { id: 'team-3', name: 'Software Development' }
  ];

  ngOnInit(): void {
    super.ngOnInit();

    const categoryStreamCreator = (query: any) =>
      this.categoryService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(categoryStreamCreator).subscribe((response: PagedResultDto<CategoryDto>) => {
      this.category = response;
      this.parentCategories = response.items || [];
    });
  }

  createCategory(): void {
    this.selectedCategory = {} as CategoryDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  editCategory(id: number): void {
    this.categoryService.get(id).subscribe((category: CategoryDto) => {
      this.selectedCategory = category;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
    });
  }

  delete(id: number, name: string): void {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.categoryService.delete(id).subscribe(() => {
          this.list.get();
          this.toaster.success('Xóa danh mục thành công!');
        });
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedCategory.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedCategory.name || '', [Validators.required, Validators.maxLength(255)]],
      isActive: [this.selectedCategory.isActive ?? true],
      parentId: [this.selectedCategory.parentId || null],
      defaultTeamId: [this.selectedCategory.defaultTeamId || null],
    });
  }

  save(): void {
    // CHẶN KHOẢNG TRẮNG TÀNG HÌNH & VALIDATE FORM
    const codeVal = this.form.get('code')?.value?.trim() || '';
    const nameVal = this.form.get('name')?.value?.trim() || '';

    if (this.form.invalid || !codeVal || !nameVal || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.toaster.error('Vui lòng điền đầy đủ thông tin (không được bỏ trống hoặc toàn khoảng trắng)!');
      return;
    }

    this.isSubmitting = true; // KHÓA NÚT NGAY LẬP TỨC

    const requestData = {
      ...this.form.value,
      code: codeVal,
      name: nameVal
    };

    const request = this.selectedCategory.id
      ? this.categoryService.update(this.selectedCategory.id, requestData)
      : this.categoryService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false; // MỞ KHÓA NÚT
        this.list.get();
        this.toaster.success('Lưu danh mục thành công!');
      },
      error: (err) => {
        console.error('Lỗi lưu danh mục:', err);
        this.toaster.error('Không thể lưu danh mục lúc này. Vui lòng thử lại!');
        this.isSubmitting = false; // MỞ KHÓA NÚT KHI GẶP LỖI
      }
    });
  }
}