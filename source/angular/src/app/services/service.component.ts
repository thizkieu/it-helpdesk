import { Component, inject, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ListService, PagedResultDto, LocalizationService, RestService, CoreModule, ConfigStateService
} from '@abp/ng.core';
import {
  ConfirmationService, Confirmation, ToasterService, ThemeSharedModule
} from '@abp/ng.theme.shared';
import { ServiceDto, ServiceService } from '../proxy/services';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule,
    NgbDropdownModule, CoreModule, ThemeSharedModule
  ],
  providers: [ListService],
})
export class ServiceComponent extends AdminBaseComponent implements OnInit, OnDestroy {
  private serviceService = inject(ServiceService);
  private restService = inject(RestService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  public localizationService = inject(LocalizationService);
  private config = inject(ConfigStateService);
  
  protected override storageKey = 'service_search_history';
  
  serviceList = { items: [], totalCount: 0 } as PagedResultDto<ServiceDto>;
  selectedService = {} as ServiceDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;
  isLoading = false;
  override searchFilter = '';
  selectedStatus: boolean | null = null;
  showStatusDropdown = false;
  
  isReassignModalOpen = false;
  serviceToDelete: any = null;
  targetReplacementServiceId: number | null = null;
  availableReplacementServices: any[] = [];
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
    
    const serviceStreamCreator = (query: any) => {
      this.isLoading = true;
      return this.serviceService.getList({ 
        ...query, filter: this.searchFilter, isActive: this.selectedStatus 
      });
    };
    
    this.list.hookToQuery(serviceStreamCreator).subscribe((response: PagedResultDto<ServiceDto>) => {
      const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
      const isEn = lang.toLowerCase().includes('en');
      const unnamedText = this.localizationService.instant('ItHelpdesk::Unnamed');
      
      const rawItems = response.items || [];
      const mappedItems = rawItems.map((item: any) => {
        const localizedName = isEn ? (item.name_En || item.name_Vi) : (item.name_Vi || item.name_En);
        const dName = localizedName ? localizedName : (item.code ? `[${unnamedText}] - ${item.code}` : '---');
        
        const localizedDesc = isEn ? (item.description_En || item.description_Vi) : (item.description_Vi || item.description_En);

        return { ...item, displayName: dName, displayDescription: localizedDesc };
      });
      
      this.serviceList = { ...response, items: mappedItems } as any;
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
      code: [this.selectedService.code || '', [Validators.required, Validators.maxLength(50)]],
      name_Vi: [(this.selectedService as any).name_Vi || '', [Validators.required, Validators.maxLength(255)]],
      name_En: [(this.selectedService as any).name_En || '', [Validators.maxLength(255)]],
      description_Vi: [(this.selectedService as any).description_Vi || '', [Validators.maxLength(500)]],
      description_En: [(this.selectedService as any).description_En || '', [Validators.maxLength(500)]],
      categoryId: [(this.selectedService as any).categoryId ?? 0],
      isActive: [this.selectedService.isActive ?? true]
    });
  }

  createService(): void { this.selectedService = {} as ServiceDto; this.buildForm(); this.isSubmitting = false; this.isModalOpen = true; }
  
  editService(id: number | string): void {
    this.isLoading = true;
    this.serviceService.get(Number(id)).subscribe({
      next: (service: ServiceDto) => { this.selectedService = service; this.buildForm(); this.isSubmitting = false; this.isLoading = false; this.isModalOpen = true; },
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
    const request = this.selectedService.id ? this.serviceService.update(Number(this.selectedService.id), requestData) : this.serviceService.create(requestData);
    request.subscribe({
      next: () => { this.isModalOpen = false; this.form.reset(); this.isSubmitting = false; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::ServiceSaveSuccess')); },
      error: (err: any) => { this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::ServiceSaveError')); this.isSubmitting = false; }
    });
  }

  toggleStatus(row: any): void {
    const updatedStatus = !row.isActive;
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::Service:ConfirmChangeStatus', row.displayName), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        const requestData = {
          code: row.code, name_Vi: row.name_Vi || row.name, name_En: row.name_En,
          description_Vi: row.description_Vi || row.description, description_En: row.description_En,
          categoryId: row.categoryId ?? 0, isActive: updatedStatus
        };
        this.serviceService.update(Number(row.id), requestData).subscribe({
          next: () => { row.isActive = updatedStatus; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::StatusUpdateSuccess')); },
          error: (err: any) => this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::StatusUpdateError'))
        });
      }
    });
  }

  delete(id: number | string, name: string): void {
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::ServiceDeleteConfirmMessage', name), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.serviceService.delete(Number(id)).subscribe({
          next: () => { this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::ServiceDeleteSuccess')); },
          error: (err: any) => {
            if (err.error && err.error.code === 'ServiceHasConstraints') {
              this.serviceToDelete = { id, name };
              
              const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
              const isEn = lang.toLowerCase().includes('en');

              this.availableReplacementServices = (this.serviceList.items || []).filter((s: any) => s.id !== Number(id) && s.isActive).map((s: any) => ({
                 ...s,
                 displayName: isEn ? (s.name_En || s.name_Vi) : (s.name_Vi || s.name_En)
              }));

              this.targetReplacementServiceId = null;
              this.isReassignModalOpen = true;
            } else {
              this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::ServiceDeleteError'));
            }
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementServiceId) { this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementServiceRequired')); return; }
    this.isSubmitting = true;
    this.restService.request<void, void>({
      method: 'DELETE', url: `/api/app/service/${this.serviceToDelete.id}/reassign-and-delete`,
      params: { replacementId: this.targetReplacementServiceId }
    }).subscribe({
      next: () => { this.isReassignModalOpen = false; this.isSubmitting = false; this.list.get(); this.toaster.success(this.localizationService.instant('ItHelpdesk::ServiceReassignAndDeleteSuccess')); },
      error: (err: any) => { this.isSubmitting = false; this.toaster.error(err.error?.message || this.localizationService.instant('ItHelpdesk::ServiceReassignAndDeleteError')); }
    });
  }
}