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

import { PriorityDto, PriorityService } from '../proxy/priorities';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-priority',
  templateUrl: './priority.component.html',
  styleUrls: ['./priority.component.scss'],
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
export class PriorityComponent extends AdminBaseComponent implements OnInit {
  private priorityService = inject(PriorityService) as any;
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  private localizationService = inject(LocalizationService);

  protected storageKey = 'priority_search_history';

  priority = { items: [], totalCount: 0 } as PagedResultDto<PriorityDto>;
  selectedPriority = {} as PriorityDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;

  searchFilter = '';
  showSearchSuggestions = false;
  recentSearches: string[] = [];

  isReassignModalOpen = false;
  priorityToDelete: any = null;
  targetReplacementPriorityId: any = null;
  availableReplacementPriorities: PriorityDto[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    this.loadSearchHistory();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::PrioritySpaceLoaded'));

    const streamCreator = (query: any) =>
      this.priorityService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.priority = response;
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
      this.toaster.success(this.localizationService.instant('ItHelpdesk::PrioritySearchFilteredSuccess', this.searchFilter || ''));
    }
    this.showSearchSuggestions = false;
    this.list.page = 0;
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.list.page = 0;
    this.list.get();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::PrioritySearchCleared'));
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

  createPriority(): void {
    this.selectedPriority = {} as PriorityDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
    this.toaster.info(this.localizationService.instant('ItHelpdesk::OpeningCreatePriorityModal'));
  }

  editPriority(id: string): void {
    this.priorityService.get(id).subscribe((data: any) => {
      this.selectedPriority = data;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
      this.toaster.info(this.localizationService.instant('ItHelpdesk::EditingPriority', data.name || ''));
    });
  }

  delete(id: string, name: string): void {
    const hasActiveTicketsLinked = false;

    if (hasActiveTicketsLinked) {
      this.priorityToDelete = { id, name };
      this.availableReplacementPriorities = (this.priority.items || []).filter((p: any) => p.id !== id && p.isActive);
      this.isReassignModalOpen = true;
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::PriorityHasLinkedTicketsWarning', name));
      return;
    }

    const confirmMsg = this.localizationService.instant('::PriorityDeleteConfirmMessage', name);
    const confirmTitle = this.localizationService.instant('::AreYouSure');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: any) => {
      if (status === Confirmation.Status.confirm) {
        this.priorityService.delete(id).subscribe({
          next: () => {
            this.list.get();
            this.toaster.success(this.localizationService.instant('::PriorityDeleteSuccess'));
          },
          error: (err: any) => {
            console.error('Lỗi khi xóa độ ưu tiên:', err);
            this.toaster.error(this.localizationService.instant('::PriorityDeleteError'));
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementPriorityId) {
      this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementPriorityRequired'));
      return;
    }

    this.isSubmitting = true;
    setTimeout(() => {
      this.priorityService.delete(this.priorityToDelete.id).subscribe({
        next: () => {
          this.isReassignModalOpen = false;
          this.isSubmitting = false;
          this.list.get();
          this.toaster.success(this.localizationService.instant('ItHelpdesk::PriorityReassignAndDeleteSuccess'));
        },
        error: () => {
          this.isSubmitting = false;
          this.toaster.error(this.localizationService.instant('ItHelpdesk::PriorityReassignAndDeleteError'));
        }
      });
    }, 600);
  }

  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedPriority.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedPriority.name || '', [Validators.required, Validators.maxLength(100)]],
      isActive: [this.selectedPriority.isActive ?? true],
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

    let request = (this.selectedPriority as any).id
      ? this.priorityService.update((this.selectedPriority as any).id, requestData)
      : this.priorityService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false;
        this.list.get();
        this.toaster.success(this.localizationService.instant('::PrioritySaveSuccess'));
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu độ ưu tiên:', err);
        this.toaster.error(this.localizationService.instant('::PrioritySaveError'));
        this.isSubmitting = false;
      }
    });
  }
}