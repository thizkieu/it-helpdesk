import { Component, OnInit, OnDestroy, inject, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService, LocalizationService, LocalizationPipe, ConfigStateService } from '@abp/ng.core';
import { ThemeSharedModule, ConfirmationService, Confirmation } from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomToastService } from '../shared/services/custom-toast.service';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxDatatableModule, LocalizationPipe, ThemeSharedModule, NgbDropdownModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private confirmation = inject(ConfirmationService);
  public localizationService = inject(LocalizationService);
  private config = inject(ConfigStateService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  
  filters = { filter: '', role: null as string | null, teamId: null as number | null, isActive: null as boolean | null, skipCount: 0, maxResultCount: 10 };
  roles: any[] = [];
  teams: any[] = [];
  userList: { items: any[], totalCount: number } = { items: [], totalCount: 0 };
  
  isLoading = false;
  isSubmitting = false;
  isUserModalOpen = false;
  isEditing = false;
  
  userForm: any = { id: null, userName: '', email: '', name: '', surname: '', phoneNumber: '', password: '', teamId: null, isActive: true, lockoutEnabled: true, concurrencyStamp: '', roleNames: [] };
  
  showRoleDropdown: boolean = false;
  showStatusDropdown: boolean = false;
  showTeamDropdown: boolean = false;
  showSearchSuggestions: boolean = false;
  
  private readonly storageKey = 'users_search_history';
  recentSearches: string[] = [];
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.querySelector('.search-wrapper')?.contains(event.target)) this.showSearchSuggestions = false;
    if (!this.elementRef.nativeElement.querySelector('.role-dropdown-wrapper')?.contains(event.target)) this.showRoleDropdown = false;
    if (!this.elementRef.nativeElement.querySelector('.status-dropdown-wrapper')?.contains(event.target)) this.showStatusDropdown = false;
    if (!this.elementRef.nativeElement.querySelector('.team-dropdown-wrapper')?.contains(event.target)) this.showTeamDropdown = false;
  }

  ngOnInit() {
    const savedState = sessionStorage.getItem('users_page_state');
    if (savedState) {
        this.filters = JSON.parse(savedState);
    }
    this.loadDependencies();
    this.loadSearchHistory();
    this.searchSubscription = this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe((keyword: string) => {
      if (keyword.trim().length >= 2) this.saveSearchHistory(keyword.trim());
      this.triggerDataLoad();
    });
  }

  ngOnDestroy(): void { 
    sessionStorage.setItem('users_page_state', JSON.stringify(this.filters));
    this.searchSubscription?.unsubscribe(); 
  }

  onPageChange(event: any): void {
    const newSkipCount = event.offset * this.filters.maxResultCount;
    if (this.filters.skipCount !== newSkipCount) { this.filters.skipCount = newSkipCount; this.getUsers(); }
  }

  private triggerDataLoad() { this.filters.skipCount = 0; this.getUsers(); }

  loadDependencies() {
    this.isLoading = true;
    forkJoin({
        rolesRes: this.restService.request<any, any>({ method: 'GET', url: '/api/identity/roles' }),
        teamsRes: this.restService.request<any, any>({ method: 'GET', url: '/api/app/team', params: { maxResultCount: 1000 } })
    }).subscribe({
        next: ({ rolesRes, teamsRes }) => {
            this.roles = rolesRes.items || rolesRes;
            
            const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
            const isEn = lang.toLowerCase().includes('en');
            
            this.teams = (teamsRes.items || []).map((t: any) => ({
                ...t,
                displayName: isEn ? (t.name_En || t.name_Vi || t.name) : (t.name_Vi || t.name_En || t.name)
            }));
            
            this.getUsers();
        },
        error: () => { this.isLoading = false; }
    });
  }

  getUsers() {
    this.isLoading = true;
    const queryParams: any = { skipCount: this.filters.skipCount, maxResultCount: this.filters.maxResultCount };
    if (this.filters.filter && this.filters.filter.trim() !== '') queryParams.filter = this.filters.filter.trim();
    if (this.filters.role) queryParams.role = this.filters.role; 
    if (this.filters.teamId) queryParams.teamId = this.filters.teamId; 
    if (this.filters.isActive !== null && this.filters.isActive !== undefined) queryParams.isActive = this.filters.isActive;
    
    const lang = this.config.getDeep('localization.currentCulture.cultureName') || 'vi';
    const isEn = lang.toLowerCase().includes('en');
    this.restService.request<any, any>({ method: 'GET', url: '/api/app/extended-user', params: queryParams }).subscribe({
      next: (res: any) => { 
          const mappedUsers = (res.items || []).map((u: any) => {
              const tId = u.teamId || (u.extraProperties && u.extraProperties.TeamId) || null;
              let dTeamName = '---';
              if (tId) {
                  const foundTeam = this.teams.find(t => t.id === tId);
                  if (foundTeam) dTeamName = foundTeam.displayName;
              }
              const mappedRoles = (u.roleNames || []).map((r: string) => this.translateRole(r, isEn));
              return {
                  ...u,
                  displayTeam: dTeamName,
                  displayRoles: mappedRoles
              };
          });
          this.userList.items = mappedUsers; 
          this.userList.totalCount = res.totalCount || 0; 
          this.isLoading = false; 
      },
      error: (err: any) => { this.extractAndShowError(err, 'ItHelpdesk::Users:ErrorLoadUsers'); this.isLoading = false; }
    });
  }

  translateRole(roleName: string, isEn: boolean): { name: string, isLeader: boolean } {
      const r = roleName.toLowerCase();
      let name = roleName;
      let isLeader = false;
      if (r === 'admin') name = isEn ? 'System Admin' : 'Quản trị hệ thống';
      else if (r === 'teamleader') { name = isEn ? 'Team Leader' : 'Trưởng nhóm'; isLeader = true; }
      else if (r === 'it_manager') { name = isEn ? 'IT Manager' : 'Quản lý IT'; isLeader = true; }
      else if (r === 'technician') name = isEn ? 'Technician' : 'Kỹ thuật viên';
      else if (r === 'end_user') name = isEn ? 'End User' : 'Người dùng';
      else if (roleName.startsWith('TEAM_')) name = roleName.replace('TEAM_', 'Team ');
      return { name, isLeader };
  }

  onActivate(event: any): void {
    if (event.type === 'click') {
        const isActionMenu = event.event.target.closest('.dropdown') || event.event.target.closest('.btn-action-dropdown');
        if (isActionMenu) return; 
        const userId = event.row.id || event.row.Id;
        if (userId) this.router.navigate(['/user-management/detail', userId]);
    }
  }

  toggleRoleDropdown(event: MouseEvent): void { event.stopPropagation(); this.showRoleDropdown = !this.showRoleDropdown; this.showStatusDropdown = false; this.showTeamDropdown = false; this.showSearchSuggestions = false; }
  toggleStatusDropdown(event: MouseEvent): void { event.stopPropagation(); this.showStatusDropdown = !this.showStatusDropdown; this.showRoleDropdown = false; this.showTeamDropdown = false; this.showSearchSuggestions = false; }
  toggleTeamDropdown(event: MouseEvent): void { event.stopPropagation(); this.showTeamDropdown = !this.showTeamDropdown; this.showRoleDropdown = false; this.showStatusDropdown = false; this.showSearchSuggestions = false; }
  
  selectRoleFilter(roleName: string | null): void { this.filters.role = roleName; this.showRoleDropdown = false; this.triggerDataLoad(); }
  selectStatusFilter(status: boolean | null): void { this.filters.isActive = status; this.showStatusDropdown = false; this.triggerDataLoad(); }
  selectTeamFilter(teamId: number | null): void { this.filters.teamId = teamId; this.showTeamDropdown = false; this.triggerDataLoad(); }
  
  getRoleName(roleName: string | null): string { return roleName ? roleName : this.localizationService.instant('ItHelpdesk::Users:FilterAllRoles'); }
  getStatusName(status: boolean | null): string { return status === null ? this.localizationService.instant('ItHelpdesk::AllStatuses') : (status ? this.localizationService.instant('ItHelpdesk::Users:Active') : this.localizationService.instant('ItHelpdesk::Inactive')); }
  getTeamFilterName(teamId: number | null): string {
      if (!teamId) return this.localizationService.instant('ItHelpdesk::Users:FilterAllTeams');
      return this.teams.find(t => t.id === teamId)?.displayName || '---';
  }
  
  onSearchInput(): void { this.showSearchSuggestions = true; this.searchSubject.next(this.filters.filter || ''); }
  performSearch(keyword?: string): void { if (keyword !== undefined) this.filters.filter = keyword; const cleanKeyword = this.filters.filter?.trim(); this.showSearchSuggestions = false; if (cleanKeyword) this.saveSearchHistory(cleanKeyword); this.triggerDataLoad(); }
  clearSearch(): void { this.filters.filter = ''; this.showSearchSuggestions = false; this.triggerDataLoad(); }
  
  private loadSearchHistory(): void { const saved = localStorage.getItem(this.storageKey); this.recentSearches = saved ? JSON.parse(saved) : []; }
  private saveSearchHistory(keyword: string): void { if (!keyword.trim()) return; const clean = keyword.trim(); this.recentSearches = [clean, ...this.recentSearches.filter(x => x.toLowerCase() !== clean.toLowerCase())].slice(0, 5); localStorage.setItem(this.storageKey, JSON.stringify(this.recentSearches)); }
  
  refreshList(): void { this.triggerDataLoad(); }
  
  toggleRole(roleName: string) { if (!this.userForm.roleNames) this.userForm.roleNames = []; const index = this.userForm.roleNames.indexOf(roleName); if (index > -1) { this.userForm.roleNames.splice(index, 1); } else { this.userForm.roleNames.push(roleName); } }
  hasRole(roleName: string): boolean { return this.userForm.roleNames?.includes(roleName) || false; }
  
  openCreateModal(): void { 
      this.isEditing = false; 
      this.userForm = { id: null, userName: '', email: '', name: '', surname: '', phoneNumber: '', password: '', teamId: null, isActive: true, lockoutEnabled: true, concurrencyStamp: '', roleNames: [] }; 
      this.isUserModalOpen = true; 
  }
  
  openEditModal(user: any): void {
    this.isEditing = true; this.isLoading = true;
    this.restService.request<any, any>({ method: 'GET', url: `/api/identity/users/${user.id}` }).subscribe({
      next: (fullUser: any) => {
        this.restService.request<any, any>({ method: 'GET', url: `/api/identity/users/${user.id}/roles` }).subscribe({
          next: (userRolesRes: any) => {
            const assignedRoles = userRolesRes.items ? userRolesRes.items.map((r: any) => r.name) : [];
            const tId = fullUser.extraProperties?.TeamId || null;
            this.userForm = { id: fullUser.id, userName: fullUser.userName, email: fullUser.email, name: fullUser.name || '', surname: fullUser.surname || '', phoneNumber: fullUser.phoneNumber || '', teamId: tId, isActive: fullUser.isActive, lockoutEnabled: fullUser.lockoutEnabled !== undefined ? fullUser.lockoutEnabled : true, concurrencyStamp: fullUser.concurrencyStamp, roleNames: assignedRoles };
            this.isLoading = false; this.isUserModalOpen = true;
          }
        });
      }
    });
  }
  
  closeUserModal(): void { this.isUserModalOpen = false; }
  
  saveUser(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.userForm.userName?.trim()) { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ErrorUsernameRequired'), 'error'); return; }
    if (!this.userForm.email?.trim() || !emailRegex.test(this.userForm.email)) { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ErrorEmailInvalid'), 'error'); return; }
    this.isSubmitting = true;
    
    const payload = { 
        userName: this.userForm.userName, email: this.userForm.email, name: this.userForm.name, surname: this.userForm.surname, 
        phoneNumber: this.userForm.phoneNumber, isActive: this.userForm.isActive, lockoutEnabled: this.userForm.lockoutEnabled, 
        concurrencyStamp: this.userForm.concurrencyStamp, password: this.userForm.password || undefined,
        extraProperties: { TeamId: this.userForm.teamId }
    };
    if (this.isEditing) {
      this.restService.request<any, any>({ method: 'PUT', url: `/api/identity/users/${this.userForm.id}`, body: payload }).subscribe({
        next: () => {
          this.restService.request<any, any>({ method: 'PUT', url: `/api/identity/users/${this.userForm.id}/roles`, body: { roleNames: this.userForm.roleNames } }).subscribe({
            next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastUpdateSuccess'), 'success'); this.closeUserModal(); this.getUsers(); this.isSubmitting = false; }
          });
        },
        error: (err) => { this.extractAndShowError(err); this.isSubmitting = false; }
      });
    } else {
      const createPayload = { ...payload, roleNames: this.userForm.roleNames };
      this.restService.request<any, any>({ method: 'POST', url: '/api/identity/users', body: createPayload }).subscribe({
        next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastCreateSuccess'), 'success'); this.closeUserModal(); this.getUsers(); this.isSubmitting = false; },
        error: (err) => { this.extractAndShowError(err); this.isSubmitting = false; }
      });
    }
  }

  toggleUserStatus(user: any): void {
    this.restService.request<any, any>({ method: 'GET', url: `/api/identity/users/${user.id}` }).subscribe({
      next: (fullUser: any) => {
        const updated = { ...fullUser, isActive: !user.isActive };
        this.restService.request<any, any>({ method: 'PUT', url: `/api/identity/users/${user.id}`, body: updated }).subscribe({
          next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastStatusSuccess'), 'success'); this.getUsers(); }
        });
      }
    });
  }

  deleteUser(user: any): void {
    if (confirm(this.localizationService.instant('ItHelpdesk::Users:ConfirmDeleteMsg'))) {
      this.restService.request<any, any>({ method: 'DELETE', url: `/api/identity/users/${user.id}` }).subscribe({
        next: () => { this.customToast.show(this.localizationService.instant('ItHelpdesk::Users:ToastDeleteSuccess'), 'success'); this.getUsers(); }
      });
    }
  }

  private extractAndShowError(err: any, fallbackKey: string = 'ItHelpdesk::Error:Generic'): void {
    const errorObj = err?.error?.error || err?.error || err;
    let msg = errorObj?.details || errorObj?.message || fallbackKey;
    this.customToast.show(msg, 'error');
  }
}