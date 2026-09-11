import type { AppNotificationDto, SendBroadcastDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  getMyNotifications = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AppNotificationDto[]>({
      method: 'GET',
      url: '/api/app/notification/my-notifications',
    },
    { apiName: this.apiName,...config });
  

  getUnreadCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/notification/unread-count',
    },
    { apiName: this.apiName,...config });
  

  markAllAsRead = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/mark-all-as-read',
    },
    { apiName: this.apiName,...config });
  

  markAsRead = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/${id}/mark-as-read`,
    },
    { apiName: this.apiName,...config });
  

  notifyAccountLocked = (userId: string, reason: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-account-locked/${userId}`,
      params: { reason },
    },
    { apiName: this.apiName,...config });
  

  notifyCategoryChanged = (adminId: string, action: string, categoryName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-category-changed/${adminId}`,
      params: { action, categoryName },
    },
    { apiName: this.apiName,...config });
  

  notifyCategoryMappingAlert = (adminId: string, deletedCategory: string, affectedTickets: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-category-mapping-alert/${adminId}`,
      params: { deletedCategory, affectedTickets },
    },
    { apiName: this.apiName,...config });
  

  notifyFailedLoginAttempts = (violatorId: string, email: string, attemptCount: number, ipAddress?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-failed-login-attempts/${violatorId}`,
      params: { email, attemptCount, ipAddress },
    },
    { apiName: this.apiName,...config });
  

  notifyKbArticlePublished = (articleTitle: string, category: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-kb-article-published',
      params: { articleTitle, category },
    },
    { apiName: this.apiName,...config });
  

  notifyMassDataExport = (adminId: string, userId: string, userName: string, moduleName: string, recordCount: number, ipAddress?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-mass-data-export',
      params: { adminId, userId, userName, moduleName, recordCount, ipAddress },
    },
    { apiName: this.apiName,...config });
  

  notifyMemberAddedToTeam = (memberId: string, teamName: string, assignerName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-member-added-to-team/${memberId}`,
      params: { teamName, assignerName },
    },
    { apiName: this.apiName,...config });
  

  notifyMemberRemovedFromTeam = (memberId: string, teamName: string, removerName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-member-removed-from-team/${memberId}`,
      params: { teamName, removerName },
    },
    { apiName: this.apiName,...config });
  

  notifyNewComment = (targetUserId: string, ticketNo: string, commenterName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-new-comment/${targetUserId}`,
      params: { ticketNo, commenterName },
    },
    { apiName: this.apiName,...config });
  

  notifyNewTicketCreated = (managerId: string, ticketNo: string, creatorName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-new-ticket-created/${managerId}`,
      params: { ticketNo, creatorName },
    },
    { apiName: this.apiName,...config });
  

  notifyPriorityChanged = (adminId: string, action: string, priorityName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-priority-changed/${adminId}`,
      params: { action, priorityName },
    },
    { apiName: this.apiName,...config });
  

  notifyPrioritySlaChanged = (teamManagerId: string, priorityName: string, newResponseMinutes: number, newResolutionMinutes: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-priority-sla-changed/${teamManagerId}`,
      params: { priorityName, newResponseMinutes, newResolutionMinutes },
    },
    { apiName: this.apiName,...config });
  

  notifyPrivilegeEscalationAttempt = (adminId: string, userId: string, userName: string, action: string, ipAddress?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-privilege-escalation-attempt',
      params: { adminId, userId, userName, action, ipAddress },
    },
    { apiName: this.apiName,...config });
  

  notifyProfileUpdated = (userId: string, isPassword?: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-profile-updated/${userId}`,
      params: { isPassword },
    },
    { apiName: this.apiName,...config });
  

  notifyRoleChanged = (userId: string, newRole: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-role-changed/${userId}`,
      params: { newRole },
    },
    { apiName: this.apiName,...config });
  

  notifyServiceChanged = (adminId: string, action: string, serviceName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-service-changed/${adminId}`,
      params: { action, serviceName },
    },
    { apiName: this.apiName,...config });
  

  notifySlaOverdue = (managerId: string, assigneeId: string, ticketNo: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-sla-overdue',
      params: { managerId, assigneeId, ticketNo },
    },
    { apiName: this.apiName,...config });
  

  notifySlaWarning = (assigneeId: string, ticketNo: string, hoursLeft: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-sla-warning/${assigneeId}`,
      params: { ticketNo, hoursLeft },
    },
    { apiName: this.apiName,...config });
  

  notifySuspiciousLogin = (userId: string, ipAddress: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-suspicious-login/${userId}`,
      params: { ipAddress },
    },
    { apiName: this.apiName,...config });
  

  notifySystemReportReady = (adminId: string, month: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-system-report-ready/${adminId}`,
      params: { month },
    },
    { apiName: this.apiName,...config });
  

  notifyTeamCreated = (managerId: string, teamName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-team-created/${managerId}`,
      params: { teamName },
    },
    { apiName: this.apiName,...config });
  

  notifyTicketAssigned = (assigneeId: string, ticketNo: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-ticket-assigned/${assigneeId}`,
      params: { ticketNo },
    },
    { apiName: this.apiName,...config });
  

  notifyTicketResolved = (ticketCreatorId: string, ticketNo: string, isClosed?: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-ticket-resolved/${ticketCreatorId}`,
      params: { ticketNo, isClosed },
    },
    { apiName: this.apiName,...config });
  

  notifyUnauthorizedAccessAttempt = (adminId: string, violatorId: string, userName: string, resourceName: string, ipAddress?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-unauthorized-access-attempt',
      params: { adminId, violatorId, userName, resourceName, ipAddress },
    },
    { apiName: this.apiName,...config });
  

  notifyUnrecognizedDeviceLogin = (userId: string, deviceName: string, ipAddress: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-unrecognized-device-login/${userId}`,
      params: { deviceName, ipAddress },
    },
    { apiName: this.apiName,...config });
  

  sendBroadcastNotification = (input: SendBroadcastDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/send-broadcast-notification',
      body: input,
    },
    { apiName: this.apiName,...config });
}