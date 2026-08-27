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
    { path: '/', name: '::Menu:Home', iconClass: 'fas fa-home', order: 1, layout: eLayoutType.application },
    {
      path: '/tickets/create',
      name: 'Tạo Yêu cầu hỗ trợ',
      iconClass: 'fas fa-plus-circle',
      order: 2,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets.Create',
    },
    {
      path: '/tickets/my-tickets',
      name: '::Menu:MyTickets',
      iconClass: 'fas fa-ticket-alt',
      order: 3,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets',
    },
    {
      path: '/tickets/dashboard',
      name: '::Menu:Dashboard',
      iconClass: 'fas fa-chart-pie',
      order: 4,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Dashboard',
    },
    {
      path: '/tickets/it-queue',
      name: 'Hàng đợi Ticket (IT)',
      iconClass: 'fas fa-list',
      order: 5,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.Tickets.Edit',
    },
    {
      path: '/tickets/knowledge-base',
      name: '::Menu:KnowledgeBase',
      iconClass: 'fas fa-book',
      order: 6,
      layout: eLayoutType.application,
      requiredPolicy: 'ItHelpdesk.KnowledgeBase',
    },
    {
      path: '/user-management', // Đổi path mới hoàn toàn để không bị trùng lặp
      name: 'Quản lý người dùng',
      iconClass: 'fas fa-users-gear',
      layout: eLayoutType.application,
      order: 7,
    },
    {
      path: '/language-texts',
      name: '::Menu:LanguageTexts',
      iconClass: 'fa fa-language',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.LanguageTexts',
      order: 100,
      invisible: true,
    },
    {
      path: '/sys-master-lists',
      name: '::Menu:SysMasterLists',
      iconClass: 'fa fa-language',
      layout: eLayoutType.application,
      parentName: 'AbpUiNavigation::Menu:Administration',
      requiredPolicy: 'ItHelpdesk.SysMasterLists',
      order: 101,
      invisible: true,
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
      path: '/profile-avatar',
      name: 'Đổi ảnh đại diện',
      iconClass: 'fas fa-camera-retro',
      order: 106,
      layout: eLayoutType.application,
      // Không cần requiredPolicy để bất kỳ tài khoản nào đăng nhập cũng thấy và dùng được!
    }
  ]);
}