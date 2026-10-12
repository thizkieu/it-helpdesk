import type { AppNotificationDto, SendBroadcastDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/notification/${id}`,
    },
    { apiName: this.apiName,...config });
  

  deleteAllMyNotifications = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/notification/all-my-notifications',
    },
    { apiName: this.apiName,...config });
  

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
  

  notifyNewComment = (targetUserId: string, ticketNo: string, commenterName: string, isInternal: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-new-comment/${targetUserId}`,
      params: { ticketNo, commenterName, isInternal },
    },
    { apiName: this.apiName,...config });
  

  notifyNewTicketCreated = (ticketNo: string, creatorName: string, serviceName: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/notification/notify-new-ticket-created',
      params: { ticketNo, creatorName, serviceName },
    },
    { apiName: this.apiName,...config });
  

  notifySlaOverdue = (assigneeId: string, ticketNo: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-sla-overdue/${assigneeId}`,
      params: { ticketNo },
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
  

  notifyUnauthorizedAccessAttempt = (violatorId: string, userName: string, resourceName: string, ipAddress?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/notification/notify-unauthorized-access-attempt/${violatorId}`,
      params: { userName, resourceName, ipAddress },
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