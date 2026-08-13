import { Component, OnInit, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  ListService,
  PagedResultDto,
  LocalizationPipe,
  PermissionDirective,
  ConfigStateService,
} from '@abp/ng.core';
import {
  NgxDatatableDefaultDirective,
  NgxDatatableListDirective,
  ModalComponent,
  ModalCloseDirective,
  ConfirmationService,
  Confirmation,
} from '@abp/ng.theme.shared';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { CommonModule } from '@angular/common';
import { AbpMultiselectComponent } from 'src/app/shared/components/abp-multiselect/abp-multiselect.component';
import {
  LanguageTextService,
  LanguageTextDto,
} from 'src/app/proxy/localization-management/language-texts';

@Component({
  selector: 'app-language-text',
  templateUrl: './language-text.component.html',
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
export class LanguageTextComponent implements OnInit {
  private service = inject(LanguageTextService);
  private fb = inject(FormBuilder);
  private confirmation = inject(ConfirmationService);
  public readonly list = inject(ListService);
  private configState = inject(ConfigStateService);

  items: PagedResultDto<LanguageTextDto> = { items: [], totalCount: 0 };
  selected = {} as LanguageTextDto;
  form!: FormGroup;
  isModalOpen = false;
  languageTextCulture: any;

  languageOptions: Array<{ id: string; text: string }> = [];

  ngOnInit() {
    const streamCreator = q => this.service.getList(q);
    this.list.hookToQuery(streamCreator).subscribe(res => {
      this.items = res;
    });
    this.languageTextCulture = this.loadLanguages();
    this.languageOptions = this.languageTextCulture.map(l => ({
      id: l.cultureName,
      text: l.displayName,
    }));
  }

  create() {
    this.selected = {} as LanguageTextDto;
    this.selected.resourceName = 'ItHelpdesk';
    this.buildForm();
    this.isModalOpen = true;
  }

  edit(id: string) {
    this.service.get(id).subscribe(item => {
      this.selected = item;
      // nếu là edit
      if (this.selected) {
        this.patchAfterLoaded();
      }
      this.buildForm();
      this.isModalOpen = true;
    });
  }

  patchAfterLoaded() {
    const sub = setInterval(() => {
      if (this.languageOptions.length) {
        this.patchCultureName();
        clearInterval(sub);
      }
    }, 50);
  }

  buildForm() {
    this.form = this.fb.group({
      resourceName: [this.selected.resourceName || '', Validators.required],
      cultureName: [
        this.selected?.cultureName ? [this.selected.cultureName] : [], // ✅ bọc trong array
        Validators.required,
      ],
      key: [this.selected.key || '', Validators.required],
      value: [this.selected.value || '', Validators.required],
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const dto = {
      ...formValue,
      cultureName: formValue.cultureName?.[0]?.id ?? null, // ✅ ép về string
    };
    let req = this.service.create(dto);

    if (this.selected.id) {
      req = this.service.update(this.selected.id, dto);
    }

    req.subscribe(() => {
      this.isModalOpen = false;
      this.list.get();
    });
  }

  delete(id: string) {
    this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(res => {
      if (res === Confirmation.Status.confirm) {
        this.service.delete(id).subscribe(() => this.list.get());
      }
    });
  }

  loadLanguages() {
    return this.configState.getDeep('localization.languages');
  }

  loadCultureNameByKey(key: string) {
    let displayName = this.languageTextCulture.find(x => x.cultureName == key)?.displayName;
    if (displayName != undefined) {
      return key + ' - ' + displayName;
    } else {
      return key;
    }
  }

  patchCultureName() {
    if (!this.selected?.cultureName) return;

    const culture = this.languageOptions.find(x => x.id === this.selected.cultureName);

    this.form.patchValue({
      cultureName: culture ? [culture] : [],
    });
  }
}
