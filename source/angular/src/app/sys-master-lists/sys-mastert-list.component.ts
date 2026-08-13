import { Component, OnInit, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ListService, PagedResultDto, LocalizationPipe, PermissionDirective } from '@abp/ng.core';
import {
  NgxDatatableDefaultDirective,
  NgxDatatableListDirective,
  ModalComponent,
  ModalCloseDirective,
  ConfirmationService,
  Confirmation,
  ToasterService,
} from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { CommonModule } from '@angular/common';
import { AbpMultiselectComponent } from 'src/app/shared/components/abp-multiselect/abp-multiselect.component';
import { SysMasterListService } from 'src/app/proxy/sys-master-lists/sys-master-list.service';
import { DeleteSysMasterListDto, SysMasterListDto } from '../proxy/sys-master-lists';
import {
  ConfirmationKeys,
  DEFAULT_COMMA,
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  NotificationKeys,
} from '../shared/constants/app.constants';
import { AbpSelectItem } from '../shared/models/abp-select-item.model';
import { buildStatusOptions } from '../shared/helper/app.helper';
import { LocalizationHelperService } from '../shared/services/localization-helper.service';

@Component({
  selector: 'app-sys-mastert-list',
  templateUrl: './sys-mastert-list.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxDatatableModule,
    NgbDropdownModule,
    ModalComponent,
    ModalCloseDirective,
    LocalizationPipe,
    PermissionDirective,
    NgxDatatableListDirective,
    NgxDatatableDefaultDirective,
    NgMultiSelectDropDownModule,
    CommonModule,
    AbpMultiselectComponent,
  ],
  providers: [ListService],
})

export class SysMasterListComponent implements OnInit {
  private service = inject(SysMasterListService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  public readonly list = inject(ListService);
  private noti = inject(ToasterService);
  private lh = inject(LocalizationHelperService);

  items: PagedResultDto<SysMasterListDto> = { items: [], totalCount: 0 };
  selected = {} as SysMasterListDto;
  form!: FormGroup;
  isModalOpen = false;
  groupCdeOptions: AbpSelectItem[] = [];
  statusOptions: AbpSelectItem[] = [];
  pageIndex = DEFAULT_PAGE_INDEX;
  pageSize = DEFAULT_PAGE_SIZE;

  searchForm!: FormGroup;
  showFilter = false;

  modalOptions: NgbModalOptions = {
    size: 'xl',
    // windowClass: 'custom-width-modal', //dùng size xl đã đủ, nếu màn hình có nhiều input có thể dùng class này thay thế cho size
  };

  // #region Xử lý load danh sách

  ngOnInit() {
    this.buildSearchForm();
    this.loadData();
    this.loadSelect();
  }

  loadData() {
    let searchValue = this.searchForm?.value;
    this.service
      .getList({
        keyWord: searchValue?.value?.keyword,
        masterListGroupCde: searchValue?.groupCode?.map(x => x.id)?.join(DEFAULT_COMMA) ?? null,
        status: searchValue?.status?.map(x => x.id)?.join(DEFAULT_COMMA) ?? null,
        pageIndex: this.pageIndex + 1,
        pageSize: this.pageSize,
      })
      .subscribe(res => {
        this.items.items = res.items;
        this.items.totalCount = res.totalCount;
      });
  }

  onPage(event: any) {
    this.pageIndex = event.offset; // offset = pageIndex
    this.loadData();
  }

  buildSearchForm() {
    this.searchForm = this.fb.group({
      keyword: [''],
      status: [[]],
      groupCode: [[]],
    });
  }

  search() {
    this.pageIndex = 0;
    this.loadData(); // reload list
  }

  reset() {
    this.searchForm.reset();
    this.pageIndex = 0;
    this.loadData();
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  // #endregion

  // #region Xử lý cập nhật dữ liệu

  create() {
    this.selected = {} as SysMasterListDto;
    this.buildForm();
    this.isModalOpen = true;
  }

  edit(id: number) {
    this.service.getById(id).subscribe(item => {
      this.selected = item;
      // nếu là edit
      if (this.selected) {
        this.patchAfterLoaded();
      }
      this.buildForm();
      this.form.patchValue(item);
      this.isModalOpen = true;
    });
  }

  patchAfterLoaded() {
    const sub = setInterval(() => {
      if (this.groupCdeOptions.length) {
        this.patchGroupCde();
        clearInterval(sub);
      }
    }, 50);
  }

  buildForm() {
    this.form = this.fb.group({
      masterListID: [0],
      masterListCode: [this.selected.masterListCode || '', Validators.required],
      masterListGroupCde: [
        this.selected?.masterListGroupCde ? [this.selected.masterListGroupCde] : [],
        Validators.required,
      ],
      masterListCdeName: [this.selected.masterListCdeName || '', Validators.required],
      mastListDefaultValue: [],
      mastListExtendValue1: [],
      mastListExtendValue2: [],
      mastListExtendValue3: [],
      mastListExtendValue4: [],
      mastListExtendValue5: [],
      description: [null, [Validators.maxLength(4000)]],
      orderNo: [],
      isActive: [true],
      rowVersion: [],
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    console.log('formValue', formValue);
    const dto = {
      ...formValue,
      masterListGroupCde: formValue.masterListGroupCde?.[0]?.id ?? null, // ✅ ép về string
    };
    let isUpdate = false;
    let req = this.service.create(dto);

    if (this.selected.masterListID) {
      req = this.service.update(dto);
      isUpdate = true;
    }

    req.subscribe(result => {
      this.isModalOpen = false;
      if (!isUpdate) {
        if (result == 1) {
          this.loadData();
          this.noti.success(NotificationKeys.AddSuccess, NotificationKeys.AddSuccessTitle);
        } else {
          this.noti.error(NotificationKeys.AddError, NotificationKeys.AddErrorTitle);
        }
      } else {
        if (result == 1) {
          this.loadData();
          this.noti.success(NotificationKeys.UpdateSuccess, NotificationKeys.UpdateSuccessTitle);
        } else {
          this.noti.error(NotificationKeys.UpdateError, NotificationKeys.UpdateErrorTitle);
        }
      }
    });
  }

  delete(masterListID: number, rowVersion: string) {
    this.confirmation.warn(ConfirmationKeys.DeleteConfirmMessage, ConfirmationKeys.DeleteConfirmTitle).subscribe(res => {
      if (res === Confirmation.Status.confirm) {
        let dtoDelete = {} as DeleteSysMasterListDto;
        dtoDelete.masterListID = masterListID;
        dtoDelete.rowVersion = rowVersion;
        this.service.delete(dtoDelete).subscribe(result => {
          console.log(result);
          if (result == 1) {
            this.loadData();
            this.noti.success(NotificationKeys.DeleteSuccess, NotificationKeys.DeleteSuccessTitle);
          } else {
            this.noti.error(NotificationKeys.DeleteError, NotificationKeys.DeleteErrorTitle);
          }
        });
      }
    });
  }

  // #endregion

  // #region Xử lý một số tab vụ liên quan đến drop down

  loadSelect() {
    this.service.getAllCde('').subscribe(res => {
      this.groupCdeOptions = res.map(g => ({
        id: g.masterListCode,
        text: g.masterListCdeName,
      }));
    });

    this.statusOptions = buildStatusOptions(this.lh);
  }

  loadGroupCdeByKey(key: string) {
    let groupCde = this.groupCdeOptions.find(x => x.id == key)?.text;
    if (groupCde != undefined) {
      return key + ' - ' + groupCde;
    } else {
      return key;
    }
  }

  patchGroupCde() {
    if (!this.selected?.masterListGroupCde) return;

    const groupCde = this.groupCdeOptions.find(x => x.id === this.selected.masterListGroupCde);

    this.form.patchValue({
      masterListGroupCde: groupCde ? [groupCde] : [],
    });
  }

  // #endregion
}
