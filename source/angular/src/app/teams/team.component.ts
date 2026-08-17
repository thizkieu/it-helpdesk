import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective, AutofocusDirective } from '@abp/ng.core';
import { ConfirmationService, Confirmation, NgxDatatableDefaultDirective, NgxDatatableListDirective, ModalCloseDirective, ModalComponent, ToasterService } from '@abp/ng.theme.shared';

// Import từ proxy
import { TeamDto, TeamService } from '../proxy/teams';

@Component({
    selector: 'app-team',
    templateUrl: './team.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxDatatableModule, NgbDropdownModule, ModalComponent, AutofocusDirective, NgxDatatableListDirective, NgxDatatableDefaultDirective, PermissionDirective, ModalCloseDirective, LocalizationPipe],
    providers: [ListService],
})
export class TeamComponent implements OnInit {
    public readonly list = inject(ListService);
    private teamService = inject(TeamService) as any; // Ép kiểu tạm thời để tránh lỗi unknown
    private fb = inject(FormBuilder);
    private confirmation = inject(ConfirmationService);
    private toaster = inject(ToasterService);

    team = { items: [], totalCount: 0 } as PagedResultDto<TeamDto>;
    selectedTeam = {} as TeamDto;
    form!: FormGroup;
    isModalOpen = false;

    ngOnInit() {
        const streamCreator = (query: any) => this.teamService.getList({ ...query, filter: query.filter || '' });
        this.list.hookToQuery(streamCreator).subscribe((response: any) => { // Thêm : any
            this.team = response;
        });
    }

    createTeam() {
        this.selectedTeam = {} as TeamDto;
        this.buildForm();
        this.isModalOpen = true;
    }

    editTeam(id: string) {
        this.teamService.get(id).subscribe((data: any) => { // Thêm : any
            this.selectedTeam = data;
            this.buildForm();
            this.isModalOpen = true;
        });
    }

    delete(id: string, name: string) {
        this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe((status: any) => { // Thêm : any
            if (status === Confirmation.Status.confirm) {
                this.teamService.delete(id).subscribe(() => {
                    this.list.get();
                    this.toaster.success('Xóa nhóm thành công!');
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
            this.toaster.success('Lưu nhóm thành công!');
        });
    }
}