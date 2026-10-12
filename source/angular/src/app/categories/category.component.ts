import { Component, inject, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ListService, PagedResultDto, LocalizationService, RestService, LocalizationPipe, ConfigStateService
} from '@abp/ng.core';
import { ConfirmationService, Confirmation, ToasterService, ThemeSharedModule } from '@abp/ng.theme.shared';
import { CategoryDto, CategoryService } from '../proxy/categories';
import { AdminBaseComponent } from '../shared/base/admin-base.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule, NgbDropdownModule, LocalizationPipe, ThemeSharedModule],
  providers: [ListService],
})
export class CategoryComponent extends AdminBaseComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private restService = inject(RestService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  public localizationService = inject(LocalizationService);
  private config = inject(ConfigStateService);
  
  protected override storageKey = 'category_search_history';
  category = { items: [], totalCount: 0 } as PagedResultDto<CategoryDto>;
  selectedCategory = {} as CategoryDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;
  isLoading = false;
  isEditing = false;
  override searchFilter = '';
  selectedStatus: boolean | null = null;
  parentCategories: any[] = [];
  showStatusDropdown = false;
  
  teams: { id: number; name: string; icon: string; color: string }[] = [];
  isReassignModalOpen = false;
  categoryToDelete: any = null;
  targetReplacementCategoryId: number | null = null;
  availableReplacementCategories: any[] = [];
  skipCount = 0;
  maxResultCount = 10;

  @HostListener('document:click', ['$event'])
  override onDocumentClick(event: MouseEvent): void {
    super.onDocumentClick(event);
    const target = event.target as Element;
    if (!target.closest('.status-dropdown-wrapper')) {
      this.showStatusDropdown = false;
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadInitialDictionaries();
  }

  loadInitialDictionaries(): void {
    this.isLoading = true;
    forkJoin({
      teamsRes: this.restService.request<any, any>({ method: 'GET', url: '/api/app/team', params: { maxResultCount: 1000 } }),
      catsRes: this.categoryService.getList({ maxResultCount: 1000 } as any)
    }).subscribe({
      next: ({ teamsRes, catsRes }) => {
        const icons = ['fa-headset', 'fa-network-wired', 'fa-server', 'fa-shield-alt', 'fa-code', 'fa-users', 'fa-database', 'fa-laptop-code'];
        const colors = ['text-info', 'text-success', 'text-warning', 'text-danger', 'text-purple', 'text-primary', 'text-pink', 'text-teal'];
        
        const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
        const isEn = lang.toLowerCase().includes('en');
        
        this.teams = (teamsRes?.items || []).map((t: any, index: number) => ({
          id: t.id,
          name: isEn ? (t.name_En || t.name_Vi || t.name) : (t.name_Vi || t.name_En || t.name), 
          icon: icons[index % icons.length],
          color: colors[index % colors.length]
        }));

        this.parentCategories = (catsRes?.items || []).map((c: any) => ({
          ...c,
          displayName: isEn ? (c.name_En || c.name_Vi || c.name) : (c.name_Vi || c.name_En || c.name)
        }));
        
        this.initCategoryStream();
      },
      error: () => this.initCategoryStream()
    });
  }

  override ngOnDestroy(): void { super.ngOnDestroy(); }

  initCategoryStream(): void {
    const categoryStreamCreator = (query: any) => {
      this.isLoading = true;
      return this.categoryService.getList({ ...query, filter: this.searchFilter, isActive: this.selectedStatus });
    };

    this.list.hookToQuery(categoryStreamCreator).subscribe((response: PagedResultDto<CategoryDto>) => {
      const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
      const isEn = lang.toLowerCase().includes('en');
      const unnamedText = this.localizationService.instant('ItHelpdesk::Unnamed');
      
      const mappedItems = (response.items || []).map((item: any) => {
        const localizedName = isEn ? (item.name_En || item.name_Vi) : (item.name_Vi || item.name_En);
        const dName = localizedName ? localizedName : (item.name || `[${unnamedText}]`);
        
        let pName = '---'; 
        if (item.parentId) {
          const parentObj = this.parentCategories.find(x => x.id === item.parentId);
          if (parentObj) pName = parentObj.displayName;
        }
        
        let teamInfo = this.teams.find(x => x.id === Number(item.defaultTeamId));
        
        return {
          ...item,
          displayName: dName, 
          displayParentName: pName,
          displayTeamName: teamInfo ? teamInfo.name : (item.defaultTeamName || '---'),
          teamIcon: teamInfo ? teamInfo.icon : 'fa-users',
          teamColor: teamInfo ? teamInfo.color : 'text-slate-400'
        };
      });

      this.category = { ...response, items: mappedItems } as any;
      this.isLoading = false;
    });
  }

  onPageChange(event: any): void { this.skipCount = event.offset * this.maxResultCount; this.list.page = event.offset; this.list.get(); }
  triggerDataLoad(): void { this.skipCount = 0; this.list.page = 0; this.list.get(); }
  refreshList(): void { 
    this.isLoading = true;
    this.categoryService.getList({ maxResultCount: 1000 } as any).subscribe(res => {
        const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
        const isEn = lang.toLowerCase().includes('en');
        this.parentCategories = (res?.items || []).map((c: any) => ({
            ...c, displayName: isEn ? (c.name_En || c.name_Vi || c.name) : (c.name_Vi || c.name_En || c.name)
        }));
        this.triggerDataLoad();
    });
  }
  override performSearch(keyword?: string): void { if (keyword !== undefined) this.searchFilter = keyword; super.performSearch(); this.triggerDataLoad(); }
  override clearSearch(): void { if (!this.searchFilter && this.selectedStatus === null) return; this.selectedStatus = null; super.clearSearch(); this.triggerDataLoad(); }
  
  toggleStatusDropdown(event: MouseEvent): void { event.stopPropagation(); this.showStatusDropdown = !this.showStatusDropdown; this.showSearchSuggestions = false; }
  selectStatusFilter(status: boolean | null): void { this.selectedStatus = status; this.showStatusDropdown = false; this.triggerDataLoad(); }
  getStatusName(status: boolean | null): string { return status === null ? this.localizationService.instant('ItHelpdesk::AllStatuses') : (status ? this.localizationService.instant('ItHelpdesk::Active') : this.localizationService.instant('ItHelpdesk::Inactive')); }
  
  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedCategory.code || '', [Validators.required, Validators.maxLength(50)]],
      name_Vi: [(this.selectedCategory as any).name_Vi || '', [Validators.required, Validators.maxLength(255)]],
      name_En: [(this.selectedCategory as any).name_En || '', [Validators.maxLength(255)]],
      isActive: [this.selectedCategory.isActive ?? true],
      parentId: [this.selectedCategory.parentId || null],
      defaultTeamId: [this.selectedCategory.defaultTeamId || null],
    });
  }

  openCreateModal(): void { this.isEditing = false; this.selectedCategory = {} as CategoryDto; this.buildForm(); this.isSubmitting = false; this.isModalOpen = true; }
  
  editCategory(id: number | string): void {
    this.isEditing = true; this.isLoading = true;
    this.categoryService.get(Number(id)).subscribe({
      next: (category: CategoryDto) => { this.selectedCategory = category; this.buildForm(); this.isSubmitting = false; this.isLoading = false; this.isModalOpen = true; },
      error: () => this.isLoading = false
    });
  }

  closeModal(): void { this.isModalOpen = false; }

  save(): void {
    const codeVal = this.form.get('code')?.value?.trim() || '';
    const nameViVal = this.form.get('name_Vi')?.value?.trim() || '';
    if (this.form.invalid || !codeVal || !nameViVal || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.toaster.error(this.localizationService.instant('ItHelpdesk::FormValidationRequired'));
      return;
    }
    this.isSubmitting = true;
    const formValues = this.form.value;
    const requestData = {
      ...formValues, code: codeVal, name_Vi: nameViVal, name: nameViVal,
      parentId: formValues.parentId ? formValues.parentId : null,
      defaultTeamId: formValues.defaultTeamId ? formValues.defaultTeamId : null
    };
    
    const request = this.selectedCategory.id ? this.categoryService.update(Number(this.selectedCategory.id), requestData) : this.categoryService.create(requestData);
    request.subscribe({
      next: () => { 
          this.isModalOpen = false; this.form.reset(); this.isSubmitting = false; 
          this.toaster.success(this.localizationService.instant('ItHelpdesk::CategorySaveSuccess'));
          this.refreshList(); 
      },
      error: (err: any) => { this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::CategorySaveError')); this.isSubmitting = false; }
    });
  }

  toggleStatus(row: any): void {
    const updatedStatus = !row.isActive;
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::ConfirmChangeStatusMessage', row.displayName), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        const requestData = {
          code: row.code, name_Vi: row.name_Vi || row.name, name_En: row.name_En,
          isActive: updatedStatus, parentId: row.parentId, defaultTeamId: row.defaultTeamId
        };
        this.categoryService.update(Number(row.id), requestData).subscribe({
          next: () => { row.isActive = updatedStatus; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::StatusUpdateSuccess')); },
          error: (err: any) => this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'))
        });
      }
    });
  }

  delete(id: number | string, name: string): void {
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::CategoryDeleteConfirmMessage', name), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.categoryService.delete(Number(id)).subscribe({
          next: () => { 
              this.toaster.success(this.localizationService.instant('ItHelpdesk::CategoryDeleteSuccess')); 
              this.refreshList(); 
          },
          error: (err: any) => {
            if (err.error && err.error.code === 'CategoryHasConstraints') {
              this.categoryToDelete = { id, name };
              this.availableReplacementCategories = this.parentCategories.filter((c: any) => c.id !== Number(id) && c.isActive);
              this.targetReplacementCategoryId = null;
              this.isReassignModalOpen = true;
            } else {
              this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::CategoryDeleteError'));
            }
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementCategoryId) { this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementCategoryRequired')); return; }
    this.isSubmitting = true;
    this.restService.request<void, void>({
      method: 'DELETE', url: `/api/app/category/${this.categoryToDelete.id}/reassign-and-delete`,
      params: { replacementId: this.targetReplacementCategoryId }
    }).subscribe({
      next: () => { 
          this.isReassignModalOpen = false; this.isSubmitting = false; 
          this.toaster.success(this.localizationService.instant('ItHelpdesk::CategoryReassignAndDeleteSuccess')); 
          this.refreshList();
      },
      error: (err: any) => { this.isSubmitting = false; this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::CategoryReassignAndDeleteError')); }
    });
  }
}