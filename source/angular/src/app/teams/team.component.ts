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

  protected storageKey = 'team_search_history';

  team = { items: [], totalCount: 0 } as PagedResultDto<TeamDto>;
  selectedTeam = {} as TeamDto;
  form!: FormGroup;
  isModalOpen = false;
  isSubmitting = false; // BỔ SUNG BIẾN CHỐNG DOUBLE-SUBMIT

  ngOnInit() {
    super.ngOnInit();

    const streamCreator = (query: any) => this.teamService.getList({ ...query, filter: this.searchFilter });

    this.list.hookToQuery(streamCreator).subscribe((response: any) => {
      this.team = response;
    });
  }

  createTeam() {
    this.selectedTeam = {} as TeamDto;
    this.buildForm();
    this.isSubmitting = false;
    this.isModalOpen = true;
  }

  editTeam(id: string) {
    this.teamService.get(id).subscribe((data: any) => {
      this.selectedTeam = data;
      this.buildForm();
      this.isSubmitting = false;
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
      code: [this.selectedTeam.code || '', [Validators.required, Validators.maxLength(50)]],
      name: [this.selectedTeam.name || '', [Validators.required, Validators.maxLength(100)]],
      isActive: [this.selectedTeam.isActive ?? true],
    });
  }

  save() {
    // CHẶN KHOẢNG TRẮNG TÀNG HÌNH (WHITESPACE VALIDATION)
    const codeVal = this.form.get('code')?.value?.trim() || '';
    const nameVal = this.form.get('name')?.value?.trim() || '';

    if (this.form.invalid || !codeVal || !nameVal || this.isSubmitting) {
      this.form.markAllAsTouched();
      this.toaster.error('Vui lòng điền đầy đủ thông tin (không được để trống hoặc toàn khoảng trắng)!');
      return;
    }

    this.isSubmitting = true; // KHÓA NÚT NGAY LẬP TỨC

    const requestData = {
      ...this.form.value,
      code: codeVal,
      name: nameVal
    };

    let request = this.selectedTeam.id
      ? this.teamService.update(this.selectedTeam.id, requestData)
      : this.teamService.create(requestData);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.form.reset();
        this.isSubmitting = false; // MỞ KHÓA NÚT
        this.list.get();
        this.toaster.success('Lưu nhóm hỗ trợ thành công!');
      },
      error: (err: any) => {
        console.error('Lỗi khi lưu nhóm:', err);
        this.toaster.error('Không thể lưu lúc này. Vui lòng thử lại!');
        this.isSubmitting = false; // MỞ KHÓA NÚT KHI GẶP LỖI
      }
    });
  }
}