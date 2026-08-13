import { provideAbpCore, withOptions } from '@abp/ng.core';
import { provideAbpOAuth } from '@abp/ng.oauth';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideAbpThemeShared,} from '@abp/ng.theme.shared';
import { provideIdentityConfig } from '@abp/ng.identity/config';
import { provideAccountConfig } from '@abp/ng.account/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { registerLocaleForEsBuild } from '@abp/ng.core/locale';
import { provideThemeLeptonX } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout } from '@abp/ng.theme.lepton-x/layouts';
import { provideLogo, withEnvironmentOptions } from "@volo/ngx-lepton-x.core";
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { APP_ROUTES } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

// 🔥 BẮT BUỘC: đăng ký locale
registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    APP_ROUTE_PROVIDER,
    provideAnimations(),
    provideAbpCore(
      withOptions({
        environment,
        // registerLocaleFn: registerLocaleForEsBuild(),
        registerLocaleFn: registerLocaleAdapter,
      }),
    ),
    provideAbpOAuth(),
    provideIdentityConfig(),
    provideSettingManagementConfig(),
    provideFeatureManagementConfig(),
    provideThemeLeptonX(),
    provideSideMenuLayout(),
    provideLogo(withEnvironmentOptions(environment)),
    provideAccountConfig(),
    provideTenantManagementConfig(),
    provideAbpThemeShared(),
  ]
};

// Adapter đảm bảo luôn có (locale: string) => Promise<any>
function registerLocaleAdapter(locale: string): Promise<any> {
  try {
    // Trường hợp A: registerLocaleForEsBuild là factory: () => (locale) => Promise
    const maybeFactory = (registerLocaleForEsBuild as unknown) as (() => ((l: string) => any));
    if (typeof maybeFactory === 'function') {
      const maybeFn = maybeFactory();
      if (typeof maybeFn === 'function') {
        const result = maybeFn(locale);
        return result instanceof Promise ? result : Promise.resolve(result);
      }
    }

    // Trường hợp B: registerLocaleForEsBuild chính là hàm (locale) => Promise
    const maybeFnDirect = (registerLocaleForEsBuild as unknown) as ((l: string) => any);
    if (typeof maybeFnDirect === 'function') {
      const result = maybeFnDirect(locale);
      return result instanceof Promise ? result : Promise.resolve(result);
    }
  } catch (e) {
    // Không để lỗi khởi tạo ngắt bootstrap; trả về resolved Promise để an toàn
    console.warn('registerLocaleAdapter error', e);
  }

  return Promise.resolve();
}
