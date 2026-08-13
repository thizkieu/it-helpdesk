import { RoutesService, eLayoutType } from '@abp/ng.core';
import { inject, provideAppInitializer } from '@angular/core';

export const APP_ROUTE_PROVIDER = [
  provideAppInitializer(() => {
    configureRoutes();
  }),
];

function configureRoutes() {
  const routes = inject(RoutesService);
  routes.add([
    {
      path: '/',
      name: '::Menu:Home',
      iconClass: 'fas fa-home',
      order: 1,
      layout: eLayoutType.application,
    },
    {
      path: '/books',
      name: '::Menu:Books',
      iconClass: 'fas fa-book',
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Books',
    },
    {
      path: '/language-texts',
      name: '::Menu:LanguageTexts',
      iconClass: 'fa fa-language',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.LanguageTexts',
      order: 100,
    },
    {
      path: '/sys-master-lists',
      name: '::Menu:SysMasterLists',
      iconClass: 'fa fa-language',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.SysMasterLists',
      order: 101,
    },
  ]);
}

/*
Mapping nhanh để nhớ
[UI hiển thị]	        [parentName đúng]
Quản trị	            AbpUiNavigation::Menu:Administration
Quản lý danh tính	    AbpIdentity::Menu:IdentityManagement
Quản lý người thuê	  AbpTenantManagement::Menu:TenantManagement
Cài đặt	              AbpSettingManagement::Menu:Settings
*/
