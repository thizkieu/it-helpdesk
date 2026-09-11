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

import { ServiceDto, ServiceService } from '../proxy/services';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-service',
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.scss'],
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
export class ServiceComponent extends AdminBaseComponent implements OnInit {
  private serviceService = inject(ServiceService) as any;
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  private localizationService = inject(LocalizationService);

  protected storageKey = 'service_search_history';

  service = { items: [], totalCount: 0 } as PagedResultDto<ServiceDto>;
  selectedService = {} as ServiceDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;

  searchFilter = '';
  showSearchSuggestions = false;
  recentSearches: string[] = [];

  isReassignModalOpen = false;
  serviceToDelete: any = null;
  targetReplacementServiceId: any = null;
  availableReplacementServices: ServiceDto[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    this.loadSearchHistory();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::ServiceSpaceLoaded'));

    const streamCreator = (query: any) =>
      this.serviceService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.service = response;
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

  onSearchInput(): void { }

  performSearch(): void {
    if (this.searchFilter) {
      this.saveSearchHistory(this.searchFilter.trim());
      this.toaster.success(this.localizationService.instant('ItHelpdesk::ServiceSearchFilteredSuccess', this.searchFilter || ''));
    }
    this.showSearchSuggestions = false;
    this.list.page = 0;
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.list.page = 0;
    this.list.get();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::ServiceSearchCleared'));
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

  createService(): void {
    this.selectedService = {} as ServiceDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
    this.toaster.info(this.localizationService.instant('ItHelpdesk::OpeningCreateServiceModal'));
  }

  editService(id: string): void {
    this.serviceService.get(id).subscribe((data: any) => {
      this.selectedService = data;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
      this.toaster.info(this.localizationService.instant('ItHelpdesk::EditingService', data.name || ''));
    });
  }

  delete(id: string, name: string): void {
    const hasActiveTicketsLinked = false;

    if (hasActiveTicketsLinked) {
      this.serviceToDelete = { id, name };
      this.availableReplacementServices = (this.service.items || []).filter((s: any) => s.id !== id && s.isActive);
      this.isReassignModalOpen = true;
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::ServiceHasLinkedTicketsWarning', name));
      return;
    }

    const confirmMsg = this.localizationService.instant('::ServiceDeleteConfirmMessage', name);
    const confirmTitle = this.localizationService.instant('::AreYouSure');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: any) => {
      if (status === Confirmation.Status.confirm) {
        this.serviceService.delete(id).subscribe({
          next: () => {
            this.list.get();
            this.toaster.success(this.localizationService.instant('::ServiceDeleteSuccess'));
          },
          error: (err: any) => {
            console.error('Lỗi khi xóa dịch vụ:', err);
            this.toaster.error(this.localizationService.instant('::ServiceDeleteError'));
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementServiceId) {
      this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementServiceRequired'));
      return;
    }

    this.isSubmitting = true;
    setTimeout(() => {
      this.serviceService.delete(this.serviceToDelete.id).subscribe({
        next: () => {
          this.isReassignModalOpen = false;
          this.isSubmitting = false;
          this.list.get();
          this.toaster.success(this.localizationService.instant('ItHelpdesk::ServiceReassignAndDeleteSuccess'));
        },
        error: () => {
          this.isSubmitting = false;
          this.toaster.error(this.localizationService.instant('ItHelpdesk::ServiceReassignAndDeleteError'));
        }
      });
    }, 600);
  }

  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedService.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedService.name || '', [Validators.required, Validators.maxLength(255)]],
      isActive: [this.selectedService.isActive ?? true],
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

    const requestData = {
      ...this.form.value,
      code: codeVal,
      name: nameVal
    };

    let request = (this.selectedService as any).id
      ? this.serviceService.update((this.selectedService as any).id, requestData)
      : this.serviceService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false;
        this.list.get();
        this.toaster.success(this.localizationService.instant('::ServiceSaveSuccess'));
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu dịch vụ:', err);
        this.toaster.error(this.localizationService.instant('::ServiceSaveError'));
        this.isSubmitting = false;
      }
    });
  }
}