import { Injectable, inject } from '@angular/core';
import { LocalizationService } from '@abp/ng.core';

@Injectable({ providedIn: 'root' })
export class LocalizationHelperService {
  private readonly localization = inject(LocalizationService);

  l(key: string): string {
    return this.localization.instant(key);
  }
}
