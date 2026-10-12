import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RestService, LocalizationService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomToastService } from '../shared/services/custom-toast.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule, LocalizationPipe, ThemeSharedModule, NgbDropdownModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnDestroy {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private confirmation = inject(ConfirmationService);
  public localizationService = inject(LocalizationService);
  private elementRef = inject(ElementRef);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private config = inject(ConfigStateService);
  
  teamList: { items: any[], totalCount: number } = { items: [], totalCount: 0 };
  isLoading = false;
  isSubmitting = false;
  
  searchFilter = '';
  selectedStatus: boolean | null = null;
  skipCount = 0;
  maxResultCount = 10;
  
  showStatusDropdown = false;
  showSearchSuggestions = false;
  
  private readonly storageKey = 'teams_search_history';
  recentSearches: string[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  
  isModalOpen = false;
  isEditing = false;
  form!: FormGroup;
  
  isMembersModalOpen = false;
  selectedTeamForMembers: any = null;
  mockLeadProfile: any = null;
  membersList: any[] = []; 
  
  isReassignModalOpen = false;
  teamToDelete: any = null;
  availableReplacementTeams: any[] = [];
  targetReplacementTeamId: number | null = null;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) this.showSearchSuggestions = false;
    if (!this.elementRef.nativeElement.querySelector('.status-dropdown-wrapper')?.contains(event.target)) this.showStatusDropdown = false;
  }

  ngOnInit() {
    const savedState = sessionStorage.getItem('teams_page_state');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        this.searchFilter = parsed.searchFilter;
        this.selectedStatus = parsed.selectedStatus;
        this.skipCount = parsed.skipCount;
    }
    
    this.route.queryParams.subscribe(params => {
        const openTeamId = params['openTeamId'];
        if (openTeamId && this.teamList.items.length > 0) {
            const targetTeam = this.teamList.items.find(t => t.id == openTeamId);
            if (targetTeam && !this.isMembersModalOpen) {
                this.openMembersModal(targetTeam);
            }
        }
    });

    this.getTeams();
    this.loadSearchHistory();
    this.searchSubscription = this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((keyword: string) => {
      if (keyword.trim().length >= 2) this.saveSearchHistory(keyword.trim());
      this.triggerDataLoad();
    });
  }

  ngOnDestroy(): void { 
    const state = { searchFilter: this.searchFilter, selectedStatus: this.selectedStatus, skipCount: this.skipCount };
    sessionStorage.setItem('teams_page_state', JSON.stringify(state));
    this.searchSubscription?.unsubscribe(); 
  }

  onPageChange(event: any): void {
    const newSkipCount = event.offset * this.maxResultCount;
    if (this.skipCount !== newSkipCount) { this.skipCount = newSkipCount; this.getTeams(); }
  }

  private triggerDataLoad() { this.skipCount = 0; this.getTeams(); }

  getTeams() {
    this.isLoading = true;
    const queryParams: any = { skipCount: this.skipCount, maxResultCount: this.maxResultCount };
    if (this.searchFilter && this.searchFilter.trim() !== '') queryParams.filter = this.searchFilter.trim();
    if (this.selectedStatus !== null) queryParams.isActive = this.selectedStatus;
    
    this.restService.request<any, any>({ method: 'GET', url: '/api/app/team', params: queryParams }).subscribe({
      next: (res: any) => { 
          const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
          const isEn = lang.toLowerCase().includes('en');
          
          const mappedItems = (res.items || []).map((item: any) => {
              const localizedName = isEn ? (item.name_En || item.name_Vi) : (item.name_Vi || item.name_En);
              const dName = localizedName ? localizedName : (item.code || '---');
              return { ...item, displayName: dName };
          });
          this.teamList = { ...res, items: mappedItems }; 
          this.isLoading = false; 
          
          const openTeamId = this.route.snapshot.queryParamMap.get('openTeamId');
          if (openTeamId && !this.isMembersModalOpen) {
              const targetTeam = this.teamList.items.find(t => t.id == openTeamId);
              if (targetTeam) {
                  this.openMembersModal(targetTeam);
              }
          }
      },
      error: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::Error:Generic'), 'error'); this.isLoading = false; }
    });
  }

  toggleStatusDropdown(event: MouseEvent): void { event.stopPropagation(); this.showStatusDropdown = !this.showStatusDropdown; this.showSearchSuggestions = false; }
  selectStatusFilter(status: boolean | null): void { this.selectedStatus = status; this.showStatusDropdown = false; this.triggerDataLoad(); }
  getStatusName(status: boolean | null): string { return status === null ? this.localizationService.instant('ItHelpdesk::AllStatuses') : (status ? this.localizationService.instant('ItHelpdesk::Active') : this.localizationService.instant('ItHelpdesk::Inactive')); }
  
  onSearchInput(): void { this.showSearchSuggestions = true; this.searchSubject.next(this.searchFilter || ''); }
  performSearch(keyword?: string): void { if (keyword !== undefined) this.searchFilter = keyword; const cleanKeyword = this.searchFilter?.trim(); this.showSearchSuggestions = false; if (cleanKeyword) this.saveSearchHistory(cleanKeyword); this.triggerDataLoad(); }
  clearSearch(): void { this.searchFilter = ''; this.showSearchSuggestions = false; this.triggerDataLoad(); }
  
  private loadSearchHistory(): void { const saved = localStorage.getItem(this.storageKey); this.recentSearches = saved ? JSON.parse(saved) : []; }
  private saveSearchHistory(keyword: string): void { if (!keyword.trim()) return; const clean = keyword.trim(); this.recentSearches = [clean, ...this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5); localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches)); }
  
  refreshList(): void { this.triggerDataLoad(); }
  buildForm() { this.form = this.fb.group({ id: [null], code: ['', Validators.required], name_Vi: ['', Validators.required], name_En: [''], isActive: [true] }); }
  createTeam() { this.buildForm(); this.isEditing = false; this.isModalOpen = true; }
  
  editTeam(id: number) {
    this.buildForm(); this.isEditing = true; this.isLoading = true;
    this.restService.request<any, any>({ method: 'GET', url: `/api/app/team/${id}` }).subscribe({
      next: (res) => { this.form.patchValue(res); this.isLoading = false; this.isModalOpen = true; },
      error: () => this.isLoading = false
    });
  }
  
  closeModal() { this.isModalOpen = false; this.form.reset(); }
  
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.customToast.show(this.localizationService.instant('ItHelpdesk::FormValidationRequired'), 'error');
      return;
    }
    this.isSubmitting = true;
    const formValue = this.form.value;
    const reqBody = { ...formValue, name_En: formValue.name_En || formValue.name_Vi };
    const req = this.isEditing 
        ? this.restService.request<any, any>({ method: 'PUT', url: `/api/app/team/${this.form.value.id}`, body: reqBody })
        : this.restService.request<any, any>({ method: 'POST', url: '/api/app/team', body: reqBody });
    
    req.subscribe({
      next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::TeamSaveSuccess'), 'success'); this.closeModal(); this.getTeams(); this.isSubmitting = false; },
      error: (err: any) => { this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::TeamSaveError'), 'error'); this.isSubmitting = false; }
    });
  }

  toggleStatus(team: any) {
    const updated = { ...team, isActive: !team.isActive };
    this.restService.request<any, any>({ method: 'PUT', url: `/api/app/team/${team.id}`, body: updated }).subscribe({
      next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::StatusUpdateSuccess'), 'success'); this.getTeams(); }
    });
  }

  delete(id: number, name: string) {
    this.confirmation.warn(this.localizationService.instant('ItHelpdesk::Team:DeleteConfirmMessage', name), this.localizationService.instant('ItHelpdesk::ConfirmAction')).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
        this.restService.request<any, any>({ method: 'GET', url: `/api/app/team/${id}/members-count` }).subscribe({
            next: (countRes: number) => {
                if (countRes > 0) {
                    this.teamToDelete = { id, name };
                    this.targetReplacementTeamId = null;
                    this.loadAvailableTeamsForReplacement(id);
                    this.isReassignModalOpen = true;
                } else {
                    this.executeDelete(id);
                }
            }
        });
      }
    });
  }

  loadAvailableTeamsForReplacement(excludeId: number) {
      this.restService.request<any, any>({ method: 'GET', url: '/api/app/team', params: { skipCount: 0, maxResultCount: 100 } }).subscribe({
          next: (res: any) => {
              const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
              const isEn = lang.toLowerCase().includes('en');
              this.availableReplacementTeams = res.items.filter((t: any) => t.id !== excludeId && t.isActive).map((t: any) => ({
                  ...t,
                  displayName: isEn ? (t.name_En || t.name_Vi) : (t.name_Vi || t.name_En)
              }));
          }
      });
  }

  confirmReassignAndDelete() {
      if(!this.targetReplacementTeamId || !this.teamToDelete) return;
      this.isSubmitting = true;
      this.restService.request<any, any>({ method: 'POST', url: `/api/app/team/${this.teamToDelete.id}/reassign-and-delete`, body: { newTeamId: this.targetReplacementTeamId } }).subscribe({
          next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::TeamDeleteSuccess'), 'success'); this.isReassignModalOpen = false; this.getTeams(); this.isSubmitting = false; },
          error: (err: any) => { this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::TeamReassignAndDeleteError'), 'error'); this.isSubmitting = false; }
      });
  }

  executeDelete(id: number) {
      this.restService.request<any, any>({ method: 'DELETE', url: `/api/app/team/${id}` }).subscribe({
          next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::TeamDeleteSuccess'), 'success'); this.getTeams(); },
          error: (err: any) => { this.customToast.show(err?.error?.message || this.localizationService.instant('ItHelpdesk::TeamDeleteError'), 'error'); }
      });
  }

  openMembersModal(team: any): void {
      this.selectedTeamForMembers = team;
      this.membersList = [];
      this.mockLeadProfile = null;
      this.isMembersModalOpen = true;
      
      this.restService.request<any, any>({
          method: 'GET',
          url: '/api/app/extended-user', 
          params: { teamId: team.id, maxResultCount: 100 } 
      }).subscribe({
          next: (res) => {
              // 1. Chỉ lấy những người thuộc nhóm này
              let allMembers = (res.items || []).filter((m: any) => m.teamId === team.id || (m.extraProperties && m.extraProperties.TeamId === team.id));
              
              // 2. Tìm ra người làm Nhóm trưởng
              const leadIndex = allMembers.findIndex((m: any) => m.roleNames && (m.roleNames.includes('Trưởng nhóm') || m.roleNames.includes('Team Leader') || m.roleNames.includes('IT Manager')));
              
              if (leadIndex > -1) {
                  const lead = allMembers[leadIndex];
                  this.mockLeadProfile = { 
                      id: lead.id,
                      avatar: lead.name ? lead.name.charAt(0).toUpperCase() : 'L', 
                      name: `${lead.surname || ''} ${lead.name || ''}`.trim() || lead.userName, 
                      role: lead.roleNames[0] || this.localizationService.instant('ItHelpdesk::TeamLeaderRole'), 
                      email: lead.email, 
                      phone: lead.phoneNumber || '---' 
                  };
                  // Cắt Trưởng nhóm ra khỏi mảng
                  allMembers.splice(leadIndex, 1);
              }
              
              // 3. Gán những thành viên CÒN LẠI vào lưới
              this.membersList = allMembers;
          }
      });
  }
  
  closeMembersModal(): void { 
      this.isMembersModalOpen = false; 
      this.router.navigate([], { relativeTo: this.route, queryParams: { openTeamId: null }, queryParamsHandling: 'merge' });
  }
  
  goToUserProfile(memberId: string): void {
      if(!memberId) return;
      const currentTeamId = this.selectedTeamForMembers?.id;
      this.isMembersModalOpen = false; 
      this.router.navigate(['/user-management/detail', memberId], {
          queryParams: { returnUrl: '/teams', openTeamId: currentTeamId }
      });
  }
}