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

  parentCategories: CategoryDto[] = [];
  teams: { id: string; name: string }[] = [
    { id: 'team-1', name: 'IT Support L1' },
    { id: 'team-2', name: 'Infrastructure Team' },
    { id: 'team-3', name: 'Software Development' }
  ];

  ngOnInit(): void {
    super.ngOnInit(); // BẮT BUỘC PHẢI CÓ để kích hoạt luồng tìm kiếm từ Base Component

    const categoryStreamCreator = (query: any) =>
      // Dùng this.searchFilter thay vì this.search$.value (vì Subject không có .value)
      this.categoryService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(categoryStreamCreator).subscribe((response: PagedResultDto<CategoryDto>) => {
      this.category = response;
      this.parentCategories = response.items || [];
    });
  }

  createCategory(): void {
    this.selectedCategory = {} as CategoryDto;
    this.buildForm();
    this.isModalOpen = true;
  }

  editCategory(id: number): void {
    this.categoryService.get(id).subscribe((category: CategoryDto) => {
      this.selectedCategory = category;
      this.buildForm();
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
      code: [this.selectedCategory.code || '', Validators.required],
      name: [this.selectedCategory.name || '', Validators.required],
      isActive: [this.selectedCategory.isActive ?? true],
      parentId: [this.selectedCategory.parentId || null],
      defaultTeamId: [this.selectedCategory.defaultTeamId || null],
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const requestData = this.form.value;
    const request = this.selectedCategory.id
      ? this.categoryService.update(this.selectedCategory.id, requestData)
      : this.categoryService.create(requestData);

    request.subscribe(() => {
      this.isModalOpen = false;
      this.form.reset();
      this.list.get();
      this.toaster.success('Lưu danh mục thành công!');
    });
  }
}