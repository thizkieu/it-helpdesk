import type { AssignTicketDto, CreateUpdateTicketDto, DashboardStatsDto, GetDashboardStatsInput, GetTicketListDto, SlaGaugeCalculationExplanationDto, TechnicianKpiDto, TicketDto, TicketTimelineDto, UploadAttachmentDto } from './models';
import type { TicketStatus } from './ticket-status.enum';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';
import type { UserDto } from '../users/models';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  addComment = (ticketId: number, content: string, isInternal?: boolean, parentId?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/ticket/comment',
      params: { ticketId, content, isInternal, parentId },
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
  

  getAssignableTechnicians = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserDto[]>({
      method: 'GET',
      url: '/api/app/ticket/assignable-technicians',
    },
    { apiName: this.apiName,...config });
  

  getDashboardStats = (input: GetDashboardStatsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, DashboardStatsDto>({
      method: 'GET',
      url: '/api/app/dashboard/statistics',
      params: { startDate: input.startDate, endDate: input.endDate, assigneeId: input.assigneeId, status: input.status, teamId: input.teamId },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetTicketListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TicketDto>>({
      method: 'GET',
      url: '/api/app/ticket',
      params: { filter: input.filter, status: input.status, assigneeId: input.assigneeId, teamId: input.teamId, unassigned: input.unassigned, isMyTickets: input.isMyTickets, isOverdue: input.isOverdue, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getSlaGaugeExplanation = (input: GetDashboardStatsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SlaGaugeCalculationExplanationDto>({
      method: 'GET',
      url: '/api/app/ticket/sla-gauge-explanation',
      params: { startDate: input.startDate, endDate: input.endDate, assigneeId: input.assigneeId, status: input.status, teamId: input.teamId },
    },
    { apiName: this.apiName,...config });
  

  getTechnicianDetail = (id: string, month?: number, year?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, object>({
      method: 'GET',
      url: `/api/app/dashboard/technician-detail/${id}`,
      params: { month, year },
    },
    { apiName: this.apiName,...config });
  

  getTechnicianKpis = (input: GetDashboardStatsInput, month?: number, year?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TechnicianKpiDto[]>({
      method: 'GET',
      url: '/api/app/dashboard/technician-kpi',
      params: { startDate: input.startDate, endDate: input.endDate, assigneeId: input.assigneeId, status: input.status, teamId: input.teamId, month, year },
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