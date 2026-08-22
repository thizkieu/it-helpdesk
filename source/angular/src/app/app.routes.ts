import { authGuard, permissionGuard } from '@abp/ng.core';
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home/home.component').then(c => c.HomeComponent),
  },
  {
    path: 'account',
    loadChildren: () => import('@abp/ng.account').then(c => c.createRoutes()),
  },
  {
    path: 'identity',
    loadChildren: () => import('@abp/ng.identity').then(c => c.createRoutes()),
  },
  {
    path: 'tenant-management',
    loadChildren: () => import('@abp/ng.tenant-management').then(c => c.createRoutes()),
  },
  {
    path: 'setting-management',
    loadChildren: () => import('@abp/ng.setting-management').then(c => c.createRoutes()),
  },
  {
    path: 'books',
    loadComponent: () => import('./book/book.component').then(c => c.BookComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories/category.component').then(c => c.CategoryComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'services',
    loadComponent: () => import('./services/service.component').then(c => c.ServiceComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'priorities',
    loadComponent: () => import('./priorities/priority.component').then(c => c.PriorityComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/team.component').then(c => c.TeamComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'language-texts',
    loadComponent: () => import('./language-management/language-texts/language-text.component').then(c => c.LanguageTextComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'sys-master-lists',
    loadComponent: () => import('./sys-master-lists/sys-mastert-list.component').then(c => c.SysMasterListComponent),
    canActivate: [authGuard, permissionGuard],
  },
  
  // ==========================================
  // NHÓM ROUTE TICKET & HELPDESK
  // ==========================================
  {
    path: 'tickets/create',
    loadComponent: () => import('./tickets/create-ticket.component').then(c => c.CreateTicketComponent),
    canActivate: [authGuard], 
  },
  {
    path: 'tickets/my-tickets',
    loadComponent: () => import('./tickets/my-tickets.component').then(c => c.MyTicketsComponent),
    canActivate: [authGuard, permissionGuard],
  },
  {
    path: 'tickets/detail/:id',
    loadComponent: () => import('./tickets/ticket-detail.component').then(c => c.TicketDetailComponent),
    canActivate: [authGuard, permissionGuard], 
  },
  {
    path: 'tickets/it-queue',
    loadComponent: () => import('./tickets/it-queue/it-queue.component').then(c => c.ItQueueComponent),
    canActivate: [authGuard, permissionGuard], 
  },
  {
    path: 'tickets/dashboard',
    loadComponent: () => import('./tickets/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard, permissionGuard], 
  },
  {
    path: 'tickets/knowledge-base',
    loadComponent: () => import('./tickets/knowledge-base/knowledge-base.component').then(c => c.KnowledgeBaseComponent),
    canActivate: [authGuard, permissionGuard], 
  }
];