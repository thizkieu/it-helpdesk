import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

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

  // Khai báo storageKey riêng cho Team
  protected storageKey = 'team_search_history';

  team = { items: [], totalCount: 0 } as PagedResultDto<TeamDto>;
  selectedTeam = {} as TeamDto;
  form!: FormGroup;
  isModalOpen = false;

  ngOnInit() {
    // BẮT BUỘC: Gọi hàm của Base Component để kích hoạt luồng tìm kiếm tự động
    super.ngOnInit();

    // Dùng this.searchFilter lấy từ BaseComponent thay vì this.search$.value
    const streamCreator = (query: any) => this.teamService.getList({ ...query, filter: this.searchFilter });
    
    this.list.hookToQuery(streamCreator).subscribe((response: any) => { 
      this.team = response;
    });
  }

  createTeam() {
    this.selectedTeam = {} as TeamDto;
    this.buildForm();
    this.isModalOpen = true;
  }

  editTeam(id: string) { 
    this.teamService.get(id).subscribe((data: any) => { 
      this.selectedTeam = data;
      this.buildForm();
      this.isModalOpen = true;
    });
  }

  delete(id: string, name: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => { 
      if (status === Confirmation.Status.confirm) {
        this.teamService.delete(id).subscribe(() => {
          this.list.get();
          this.toaster.success('Xóa nhóm hỗ trợ thành công!');
        });
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      code: [this.selectedTeam.code || '', Validators.required],
      name: [this.selectedTeam.name || '', Validators.required],
      isActive: [this.selectedTeam.isActive ?? true],
    });
  }

  save() {
    if (this.form.invalid) return;

    const requestData = this.form.value;
    let request = this.selectedTeam.id
      ? this.teamService.update(this.selectedTeam.id, requestData)
      : this.teamService.create(requestData);

    request.subscribe(() => {
      this.isModalOpen = false;
      this.form.reset();
      this.list.get();
      this.toaster.success('Lưu nhóm hỗ trợ thành công!');
    });
  }
}