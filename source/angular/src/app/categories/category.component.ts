import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {
  ListService,
  PagedResultDto,
  LocalizationPipe,
  LocalizationService,
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
  private localizationService = inject(LocalizationService);

  protected storageKey = 'category_search_history';

  category = { items: [], totalCount: 0 } as PagedResultDto<CategoryDto>;
  selectedCategory = {} as CategoryDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;

  searchFilter = '';
  showSearchSuggestions = false;
  recentSearches: string[] = [];

  parentCategories: CategoryDto[] = [];
  teams: { id: string; name: string }[] = [
    { id: 'team-1', name: 'IT Support L1' },
    { id: 'team-2', name: 'Infrastructure Team' },
    { id: 'team-3', name: 'Software Development' }
  ];

  // --- BIẾN PHỤC VỤ NGHIỆP VỤ RÀNG BUỘC & RE-MAPPING ---
  isReassignModalOpen = false;
  categoryToDelete: any = null;
  targetReplacementCategoryId: number | null = null;
  availableReplacementCategories: CategoryDto[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    this.loadSearchHistory();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::CategorySpaceLoaded'));

    const categoryStreamCreator = (query: any) =>
      this.categoryService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(categoryStreamCreator).subscribe((response: PagedResultDto<CategoryDto>) => {
      this.category = response;
      this.parentCategories = response.items || [];
    });
  }

  loadSearchHistory(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try { this.recentSearches = JSON.parse(saved); } catch (e) { this.recentSearches = []; }
    }
  }

  saveSearchHistory(keyword: string): void {
    if (!keyword.trim()) return;
    const index = this.recentSearches.indexOf(keyword);
    if (index > -1) this.recentSearches.splice(index, 1);
    this.recentSearches.unshift(keyword);
    if (this.recentSearches.length > 5) this.recentSearches.pop();
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
  }

  onSearchInput(): void {}

performSearch(): void {
    if (this.searchFilter) {
      this.saveSearchHistory(this.searchFilter.trim());
      this.toaster.success(this.localizationService.instant('ItHelpdesk::SearchFilteredSuccess', this.searchFilter || ''));
    }
    this.showSearchSuggestions = false;
    this.list.page = 0; 
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.list.page = 0;
    this.list.get();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::SearchCleared'));
  }

  selectSearchSuggestion(item: string): void {
    this.searchFilter = item;
    this.performSearch();
  }

  removeSearchHistoryItem(item: string, event: Event): void {
    event.stopPropagation();
    this.recentSearches = this.recentSearches.filter(s => s !== item);
    localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches));
    this.toaster.success(this.localizationService.instant('ItHelpdesk::HistoryItemRemoved'));
  }

  clearAllSearchHistory(event: Event): void {
    event.stopPropagation();
    this.recentSearches = [];
    localStorage.removeItem(this.storageKey);
    this.toaster.success(this.localizationService.instant('ItHelpdesk::HistoryClearedAll'));
  }

  createCategory(): void {
    this.selectedCategory = {} as CategoryDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
    this.toaster.info(this.localizationService.instant('ItHelpdesk::OpeningCreateCategoryModal'));
  }

  editCategory(id: number | string): void {
    this.categoryService.get(Number(id)).subscribe((category: CategoryDto) => {
      this.selectedCategory = category;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
      this.toaster.info(this.localizationService.instant('ItHelpdesk::EditingCategory', category.name || ''));
    });
  }

  // --- NGHIỆP VỤ RÀNG BUỘC AN TOÀN KHI XÓA / VÔ HIỆU HÓA ---
  delete(id: number | string, name: string): void {
    const hasActiveTicketsLinked = false; // Thay thế bằng API check thực tế từ backend nếu có

    if (hasActiveTicketsLinked) {
      this.categoryToDelete = { id, name };
      this.availableReplacementCategories = this.categoryCategoriesExcluding(Number(id));
      this.isReassignModalOpen = true;
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::CategoryHasLinkedTicketsWarning', name));
      return;
    }

    const confirmMsg = this.localizationService.instant('::CategoryDeleteConfirmMessage', name);
    const confirmTitle = this.localizationService.instant('::AreYouSure');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.categoryService.delete(Number(id)).subscribe({
          next: () => {
            this.list.get();
            this.toaster.success(this.localizationService.instant('::CategoryDeleteSuccess'));
          },
          error: (err) => {
            console.error('Lỗi khi xóa danh mục:', err);
            this.toaster.error(this.localizationService.instant('::CategoryDeleteError'));
          }
        });
      }
    });
  }

  categoryCategoriesExcluding(excludeId: number): CategoryDto[] {
    return (this.category.items || []).filter((c: any) => c.id !== excludeId && c.isActive);
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementCategoryId) {
      this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementCategoryRequired'));
      return;
    }

    this.isSubmitting = true;
    setTimeout(() => {
      this.categoryService.delete(Number(this.categoryToDelete.id)).subscribe({
        next: () => {
          this.isReassignModalOpen = false;
          this.isSubmitting = false;
          this.list.get();
          this.toaster.success(this.localizationService.instant('ItHelpdesk::CategoryReassignAndDeleteSuccess'));
        },
        error: () => {
          this.isSubmitting = false;
          this.toaster.error(this.localizationService.instant('ItHelpdesk::CategoryReassignAndDeleteError'));
        }
      });
    }, 600);
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
    const codeVal = this.form.get('code')?.value?.trim() || '';
    const nameVal = this.form.get('name')?.value?.trim() || '';

    if (this.form.invalid || !codeVal || !nameVal || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.toaster.error(this.localizationService.instant('::FormValidationRequired'));
      return;
    }

    this.isSubmitting = true;

    const formValues = this.form.value;
    const requestData = {
      ...formValues,
      code: codeVal,
      name: nameVal,
      parentId: formValues.parentId ? formValues.parentId : null,
      defaultTeamId: formValues.defaultTeamId ? formValues.defaultTeamId : null
    };

    const request = this.selectedCategory.id
      ? this.categoryService.update(Number(this.selectedCategory.id), requestData)
      : this.categoryService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false;
        this.list.get();
        this.toaster.success(this.localizationService.instant('::CategorySaveSuccess'));
      },
      error: (err) => {
        console.error('Lỗi lưu danh mục:', err);
        this.toaster.error(this.localizationService.instant('::CategorySaveError'));
        this.isSubmitting = false;
      }
    });
  }
}