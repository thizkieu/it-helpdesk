import { AbpSelectItem } from '../models/abp-select-item.model';
import { LocalizationHelperService } from '../services/localization-helper.service';

export function buildStatusOptions(lh: LocalizationHelperService): AbpSelectItem[] {
  return [
    { id: '1', text: lh.l('::Active') },
    { id: '0', text: lh.l('::Inactive') },
  ];
}
