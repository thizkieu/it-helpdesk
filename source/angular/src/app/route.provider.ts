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
      path: '/tickets/create',
      name: '::Menu:Tickets',
      iconClass: 'fas fa-ticket-alt',
      order: 2,
      layout: eLayoutType.application,
    },
    {
      path: '/tickets/my-tickets',
      name: '::Menu:MyTickets',
      iconClass: 'fas fa-tasks',
      order: 3,
      layout: eLayoutType.application,
    },
        {
      path: '/books',
      name: '::Menu:Books',
      iconClass: 'fas fa-book',
      layout: eLayoutType.application,
      order: 4,
      requiredPolicy: 'ItHelpdesk.Books',
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
    {
      path: '/categories',
      name: '::Menu:Categories',
      iconClass: 'fas fa-list',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Categories',
      order: 102,
    },
    {
      path: '/services',
      name: '::Menu:Services',
      iconClass: 'fas fa-concierge-bell',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Services',
      order: 103,
    },
    {
      path: '/priorities',
      name: '::Menu:Priorities',
      iconClass: 'fas fa-sort-amount-up',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Priorities',
      order: 104,
    },
    {
      path: '/teams',
      name: '::Menu:Teams',
      iconClass: 'fas fa-users',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Teams',
      order: 105,
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
