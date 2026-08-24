import type { AssignTicketDto, CreateUpdateTicketDto, DashboardStatsDto, GetTicketListDto, TicketDto, TicketTimelineDto, UploadAttachmentDto } from './models';
import type { TicketStatus } from './ticket-status.enum';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  addComment = (ticketId: number, content: string, isInternal?: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/ticket/comment/${ticketId}`,
      params: { content, isInternal },
    },
    { apiName: this.apiName,...config });
  

  assignTicket = (input: AssignTicketDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/ticket/assign-ticket',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  changeStatus = (ticketId: number, newStatus: TicketStatus, comment?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/ticket/change-status/${ticketId}`,
      params: { newStatus, comment },
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateTicketDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketDto>({
      method: 'POST',
      url: '/api/app/ticket',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/ticket/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketDto>({
      method: 'GET',
      url: `/api/app/ticket/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getAttachments = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UploadAttachmentDto[]>({
      method: 'GET',
      url: `/api/app/ticket/${ticketId}/attachments`,
    },
    { apiName: this.apiName,...config });
  

  getDashboardStats = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, DashboardStatsDto>({
      method: 'GET',
      url: '/api/app/ticket/dashboard-stats',
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetTicketListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TicketDto>>({
      method: 'GET',
      url: '/api/app/ticket',
      params: { filter: input.filter, status: input.status, assigneeId: input.assigneeId, teamId: input.teamId, unassigned: input.unassigned, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getTimeline = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketTimelineDto[]>({
      method: 'GET',
      url: `/api/app/ticket/timeline/${ticketId}`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdateTicketDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketDto>({
      method: 'PUT',
      url: `/api/app/ticket/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  uploadAttachment = (input: UploadAttachmentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/ticket/upload-attachment',
      body: input,
    },
    { apiName: this.apiName,...config });
}