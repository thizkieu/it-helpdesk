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

import { TeamDto, TeamService } from '../proxy/teams';
import { AdminBaseComponent } from '../shared/base/admin-base.component';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
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
export class TeamComponent extends AdminBaseComponent implements OnInit {
  private teamService = inject(TeamService) as any;
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  private toaster = inject(ToasterService);
  private localizationService = inject(LocalizationService);

  protected storageKey = 'team_search_history';

  team = { items: [], totalCount: 0 } as PagedResultDto<TeamDto>;
  selectedTeam = {} as TeamDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false;

  searchFilter = '';
  showSearchSuggestions = false;
  recentSearches: string[] = [];

  isReassignModalOpen = false;
  teamToDelete: any = null;
  targetReplacementTeamId: any = null;
  availableReplacementTeams: TeamDto[] = [];

  ngOnInit(): void {
    super.ngOnInit();
    this.loadSearchHistory();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::TeamSpaceLoaded'));

    const streamCreator = (query: any) =>
      this.teamService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.team = response;
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
      this.toaster.success(this.localizationService.instant('ItHelpdesk::TeamSearchFilteredSuccess', this.searchFilter || ''));
    }
    this.showSearchSuggestions = false;
    this.list.page = 0;
    this.list.get();
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.list.page = 0;
    this.list.get();
    this.toaster.info(this.localizationService.instant('ItHelpdesk::TeamSearchCleared'));
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

  createTeam(): void {
    this.selectedTeam = {} as TeamDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
    this.toaster.info(this.localizationService.instant('ItHelpdesk::OpeningCreateTeamModal'));
  }

  editTeam(id: string): void {
    this.teamService.get(id).subscribe((data: any) => {
      this.selectedTeam = data;
      this.buildForm();
      this.isSubmitting = false;
      this.isModalOpen = true;
      this.toaster.info(this.localizationService.instant('ItHelpdesk::EditingTeam', data.name || ''));
    });
  }

  delete(id: string, name: string): void {
    const hasActiveTicketsOrMembersLinked = false;

    if (hasActiveTicketsOrMembersLinked) {
      this.teamToDelete = { id, name };
      this.availableReplacementTeams = (this.team.items || []).filter((t: any) => t.id !== id && t.isActive);
      this.isReassignModalOpen = true;
      this.toaster.warn(this.localizationService.instant('ItHelpdesk::TeamHasLinkedDataWarning', name));
      return;
    }

    const confirmMsg = this.localizationService.instant('::TeamDeleteConfirmMessage', name);
    const confirmTitle = this.localizationService.instant('::AreYouSure');

    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: any) => {
      if (status === Confirmation.Status.confirm) {
        this.teamService.delete(id).subscribe({
          next: () => {
            this.list.get();
            this.toaster.success(this.localizationService.instant('::TeamDeleteSuccess'));
          },
          error: (err: any) => {
            console.error('Lỗi khi xóa nhóm:', err);
            this.toaster.error(this.localizationService.instant('::TeamDeleteError'));
          }
        });
      }
    });
  }

  confirmReassignAndDelete(): void {
    if (!this.targetReplacementTeamId) {
      this.toaster.error(this.localizationService.instant('ItHelpdesk::SelectReplacementTeamRequired'));
      return;
    }

    this.isSubmitting = true;
    setTimeout(() => {
      this.teamService.delete(this.teamToDelete.id).subscribe({
        next: () => {
          this.isReassignModalOpen = false;
          this.isSubmitting = false;
          this.list.get();
          this.toaster.success(this.localizationService.instant('ItHelpdesk::TeamReassignAndDeleteSuccess'));
        },
        error: () => {
          this.isSubmitting = false;
          this.toaster.error(this.localizationService.instant('ItHelpdesk::TeamReassignAndDeleteError'));
        }
      });
    }, 600);
  }

  buildForm(): void {
    this.form = this.fb.group({
      code: [this.selectedTeam.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedTeam.name || '', [Validators.required, Validators.maxLength(100)]],
      isActive: [this.selectedTeam.isActive ?? true],
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

    let request = (this.selectedTeam as any).id
      ? this.teamService.update((this.selectedTeam as any).id, requestData)
      : this.teamService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false;
        this.list.get();
        this.toaster.success(this.localizationService.instant('::TeamSaveSuccess'));
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu nhóm:', err);
        this.toaster.error(this.localizationService.instant('::TeamSaveError'));
        this.isSubmitting = false;
      }
    });
  }
}