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
      name: 'ItHelpdesk::Menu:Home',
      iconClass: 'fas fa-home', 
      order: 1,
      layout: eLayoutType.application
    },
    {
      path: '/tickets/dashboard',
      name: 'ItHelpdesk::Menu:Dashboard',
      iconClass: 'fas fa-chart-line', 
      order: 2,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Dashboard',
    },
    {
      path: '/tickets/create',
      name: 'ItHelpdesk::Menu:Tickets',
      iconClass: 'fas fa-plus-square', 
      order: 3,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets.Create',
    },

    // MŨI TÊN NHỌN 
    {
      path: '/tickets/my-tickets',
      name: 'ItHelpdesk::Menu:MyTickets',
      iconClass: 'fas fa-chevron-right',
      order: 4,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets',
    },
    {
      path: '/tickets/it-queue',
      name: 'ItHelpdesk::Menu:ITQueue',
      iconClass: 'fas fa-chevron-right',
      order: 5,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets.Edit',
    },
    {
      path: '/tickets/knowledge-base',
      name: 'ItHelpdesk::Menu:KnowledgeBase',
      iconClass: 'fas fa-chevron-right',
      order: 6,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.KnowledgeBase',
    },
    {
      path: '/notifications',
      name: 'ItHelpdesk::Menu:Notifications',
      iconClass: 'fas fa-chevron-right',
      order: 7,
      layout: eLayoutType.application,
    },
    {
      path: '/user-management',
      name: 'ItHelpdesk::Menu:UserManagement',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      order: 8,
      requiredPolicy: 'ItHelpdesk.UserManagement',
    },
    {
      path: '/my-profile',
      name: 'ItHelpdesk::Menu:MyProfile',
      iconClass: 'fas fa-chevron-right',
      order: 9,
      layout: eLayoutType.application,
    },
    // ---- CÁC DANH MỤC QUẢN TRỊ (ADMIN) ----
    {
      path: '/language-texts',
      name: 'ItHelpdesk::Menu:LanguageTexts',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.LanguageTexts',
      order: 100,
      invisible: true,
    },
    {
      path: '/sys-master-lists',
      name: 'ItHelpdesk::Menu:SysMasterLists',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.SysMasterLists',
      order: 101,
      invisible: true,
    },
    {
      path: '/categories',
      name: 'ItHelpdesk::Menu:Categories',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Categories',
      order: 102,
    },
    {
      path: '/services',
      name: 'ItHelpdesk::Menu:Services',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Services',
      order: 103,
    },
    {
      path: '/priorities',
      name: 'ItHelpdesk::Menu:Priorities',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Priorities',
      order: 104,
    },
    {
      path: '/teams',
      name: 'ItHelpdesk::Menu:Teams',
      iconClass: 'fas fa-chevron-right',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.Teams',
      order: 105,
    }
  ]);
}