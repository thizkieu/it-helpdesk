import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { AbpSelectItem } from '../../models/abp-select-item.model';
import { LocalizationHelperService } from 'src/app/shared/services/localization-helper.service';

@Component({
  selector: 'app-multiselect',
  standalone: true,
  imports: [CommonModule, FormsModule, NgMultiSelectDropDownModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AbpMultiselectComponent,
      multi: true,
    },
  ],
  templateUrl: './abp-multiselect.component.html',
  styleUrls: ['./abp-multiselect.component.scss'],
})
export class AbpMultiselectComponent implements ControlValueAccessor, OnInit, OnChanges {
  readonly lh = inject(LocalizationHelperService);

  @Input() items: AbpSelectItem[] = [];
  @Input() single = false;
  @Input() placeholderKey = '::Select';
  @Input() disabled = false;
  @Input() itemsShowLimit = 3;
  @Input() padded = true;

  value: AbpSelectItem[] = [];
  settings: any = {};

  ngOnInit() {
    this.buildSettings();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['single']) {
      this.buildSettings();
    }
  }

  private buildSettings() {
    this.settings = {
      singleSelection: this.single,
      idField: 'id',
      textField: 'text',
      itemsShowLimit: this.itemsShowLimit,
      allowSearchFilter: true,
      enableCheckAll: !this.single,
      closeDropDownOnSelection: this.single,

      searchPlaceholderText: this.lh.l('::Search'),
      selectAllText: this.lh.l('::SelectAll'),
      unSelectAllText: this.lh.l('::UnselectAll'),
      noDataAvailablePlaceholderText: this.lh.l('::NoData'),
      noFilteredDataAvailablePlaceholderText: this.lh.l('::NoFilteredData'),
    };
  }

  handleChange(value: AbpSelectItem[]) {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  // ===== CVA =====
  writeValue(value: AbpSelectItem[]): void {
    this.value = value ?? [];
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  onChange = (_: any) => {};
  onTouched = () => {};
}
