import { Component, inject, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ListService, PagedResultDto, LocalizationService, RestService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { ConfirmationService, Confirmation, ToasterService, ThemeSharedModule } from '@abp/ng.theme.shared';
import { PriorityDto, PriorityService } from '../proxy/priorities';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-priority',
  templateUrl: './priority.component.html',
  styleUrls: ['./priority.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule, NgbDropdownModule, LocalizationPipe, ThemeSharedModule],
  providers: [ListService],
})
export class PriorityComponent extends AdminBaseComponent implements OnInit, OnDestroy {
  private priorityService = inject(PriorityService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  public localizationService = inject(LocalizationService);
  private restService = inject(RestService);
  private config = inject(ConfigStateService);
  
  protected override storageKey = 'priority_search_history';
  override searchFilter = '';
  priorityList = { items: [], totalCount: 0 } as PagedResultDto<PriorityDto>;
  selectedPriority = {} as PriorityDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;
  isLoading = false;
  selectedStatus: boolean | null = null;
  showStatusDropdown = false;
  
  isReassignModalOpen = false;
  priorityToDelete: any = null;
  targetReplacementPriorityId: number | null = null;
  availableReplacementPriorities: any[] = [];
  
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
    const priorityStreamCreator = (query: any) => {
      this.isLoading = true;
      return this.priorityService.getList({ ...query, filter: this.searchFilter, isActive: this.selectedStatus });
    };
    
    this.list.hookToQuery(priorityStreamCreator).subscribe((response: PagedResultDto<PriorityDto>) => {
      const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
      const isEn = lang.toLowerCase().includes('en');
      const unnamedText = this.localizationService.instant('ItHelpdesk::Unnamed');

      const rawItems = response.items || [];
      const mappedItems = rawItems.map((item: any) => {
        const localizedName = isEn ? (item.name_En || item.name_Vi) : (item.name_Vi || item.name_En);
        const dName = localizedName ? localizedName : ((item.name && item.name.trim() !== '') ? item.name : (item.code ? `[${unnamedText}] - ${item.code}` : '---'));
        return { ...item, displayName: dName };
      });
      this.priorityList = { ...response, items: mappedItems } as any;
      this.isLoading = false;
    });
  }

  override ngOnDestroy(): void { super.ngOnDestroy(); }
  onPageChange(event: any): void { this.skipCount = event.offset * this.maxResultCount; this.list.page = event.offset; this.list.get(); }
  triggerDataLoad(): void { this.skipCount = 0; this.list.page = 0; this.list.get(); }
  refreshList(): void { this.triggerDataLoad(); }
  override performSearch(keyword?: string): void { if (keyword !== undefined) this.searchFilter = keyword; super.performSearch(); this.triggerDataLoad(); }
  override clearSearch(): void { if (!this.searchFilter && this.selectedStatus === null) return; this.selectedStatus = null; super.clearSearch(); this.triggerDataLoad(); }
  
  toggleStatusDropdown(event: MouseEvent): void { event.stopPropagation(); this.showStatusDropdown = !this.showStatusDropdown; this.showSearchSuggestions = false; }
  selectStatusFilter(status: boolean | null): void { this.selectedStatus = status; this.showStatusDropdown = false; this.triggerDataLoad(); }
  getStatusName(status: boolean | null): string { return status === null ? this.localizationService.instant('ItHelpdesk::AllStatuses') : (status ? this.localizationService.instant('ItHelpdesk::Active') : this.localizationService.instant('ItHelpdesk::Inactive')); }
  
  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedPriority.code || '', [Validators.required, Validators.maxLength(50)]],
      name_Vi: [(this.selectedPriority as any).name_Vi || '', [Validators.required, Validators.maxLength(255)]],
      name_En: [(this.selectedPriority as any).name_En || '', [Validators.maxLength(255)]],
      level: [this.selectedPriority.level || 1, [Validators.required, Validators.min(1)]],
      responseMinutes: [this.selectedPriority.responseMinutes || null, [Validators.required, Validators.min(0)]],
      resolutionMinutes: [this.selectedPriority.resolutionMinutes || null, [Validators.required, Validators.min(0)]],
      isActive: [this.selectedPriority.isActive ?? true]
    });
  }

  createPriority(): void { this.selectedPriority = {} as PriorityDto; this.buildForm(); this.isSubmitting = false; this.isModalOpen = true; }
  editPriority(id: number | string): void {
    this.isLoading = true;
    this.priorityService.get(Number(id)).subscribe({
      next: (priority: PriorityDto) => { this.selectedPriority = priority; this.buildForm(); this.isSubmitting = false; this.isLoading = false; this.isModalOpen = true; },
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
    const requestData = { ...formValues, code: codeVal, name_Vi: nameViVal, name: nameViVal };
    const request = this.selectedPriority.id ? this.priorityService.update(Number(this.selectedPriority.id), requestData) : this.priorityService.create(requestData);
    request.subscribe({
      next: () => { this.isModalOpen = false; this.form.reset(); this.isSubmitting = false; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::PrioritySaveSuccess')); },
      error: (err: any) => { this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::PrioritySaveError')); this.isSubmitting = false; }
    });
  }

  toggleStatus(row: any): void {
    const updatedStatus = !row.isActive;
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::ConfirmChangeStatusMessage', row.displayName), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        const requestData = {
          code: row.code, name_Vi: row.name_Vi || row.name, name_En: row.name_En,
          level: row.level, responseMinutes: row.responseMinutes, resolutionMinutes: row.resolutionMinutes, isActive: updatedStatus
        };
        this.priorityService.update(Number(row.id), requestData).subscribe({
          next: () => { row.isActive = updatedStatus; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::StatusUpdateSuccess')); },
          error: (err: any) => this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::Error:Generic'))
        });
      }
    });
  }

  delete(id: number | string, name: string): void {
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::PriorityDeleteConfirmMessage', name), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.priorityService.delete(Number(id)).subscribe({
          next: () => { this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::PriorityDeleteSuccess')); },
          error: (err: any) => {
            if (err.error && err.error.code === 'PriorityHasConstraints') {
              this.priorityToDelete = { id, name };
              
              const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
              const isEn = lang.toLowerCase().includes('en');

              this.availableReplacementPriorities = (this.priorityList.items || []).filter((p: any) => p.id !== Number(id) && p.isActive).map((p: any) => ({
                 ...p,
                 displayName: isEn ? (p.name_En || p.name_Vi) : (p.name_Vi || p.name_En)
              }));
              this.targetReplacementPriorityId = null;
              this.isReassignModalOpen = true;
            } else {
              this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::PriorityDeleteError'));
            }
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementPriorityId) { this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementPriorityRequired')); return; }
    this.isSubmitting = true;
    this.restService.request<void, void>({
      method: 'DELETE', url: `/api/app/priority/${this.priorityToDelete.id}/reassign-and-delete`,
      params: { replacementId: this.targetReplacementPriorityId }
    }).subscribe({
      next: () => { this.isReassignModalOpen = false; this.isSubmitting = false; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::PriorityReassignAndDeleteSuccess')); },
      error: (err: any) => { this.isSubmitting = false; this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::PriorityReassignAndDeleteError')); }
    });
  }
}