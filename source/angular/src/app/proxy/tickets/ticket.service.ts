import type { AssignTicketDto, ChangeTicketStatusInput, CreateUpdateTicketDto, DashboardStatsDto, GetTicketListDto, TicketDto, TicketTimelineDto, UploadAttachmentDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';
import type { TicketDeleteRequest, TicketInfoRequest, TicketInsertOrUpdateRequest, TicketListRequest, TicketReportRequest } from '../provider/request/models';
import type { TicketListQueryResponse, TicketReportResponse } from '../provider/response/models';
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
  

  changeStatus = (input: ChangeTicketStatusInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/ticket/change-status',
      body: input,
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
  

  deleteViaStore = (input: TicketDeleteRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'DELETE',
      url: '/api/app/ticket/via-store',
      params: { id: input.id },
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
  

  getInfoFromStore = (input: TicketInfoRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketListQueryResponse>({
      method: 'GET',
      url: '/api/app/ticket/info-from-store',
      params: { id: input.id },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetTicketListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TicketDto>>({
      method: 'GET',
      url: '/api/app/ticket',
      params: { filter: input.filter, status: input.status, assigneeId: input.assigneeId, teamId: input.teamId, unassigned: input.unassigned, isMyTickets: input.isMyTickets, isOverdue: input.isOverdue, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getListFromStore = (input: TicketListRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketListQueryResponse[]>({
      method: 'GET',
      url: '/api/app/ticket/from-store',
      params: { filterText: input.filterText, status: input.status, categoryId: input.categoryId, priorityId: input.priorityId, assigneeId: input.assigneeId, teamId: input.teamId, unassigned: input.unassigned, creatorId: input.creatorId, pageIndex: input.pageIndex, pageSize: input.pageSize, tenantId: input.tenantId, isOverdue: input.isOverdue },
    },
    { apiName: this.apiName,...config });
  

  getReportSummary = (input: TicketReportRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketReportResponse[]>({
      method: 'GET',
      url: '/api/app/ticket/report-summary',
      params: { fromDate: input.fromDate, toDate: input.toDate },
    },
    { apiName: this.apiName,...config });
  

  getTimeline = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketTimelineDto[]>({
      method: 'GET',
      url: `/api/app/ticket/timeline/${ticketId}`,
    },
    { apiName: this.apiName,...config });
  

  insertViaStore = (input: TicketInsertOrUpdateRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: '/api/app/ticket/via-store',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdateTicketDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketDto>({
      method: 'PUT',
      url: `/api/app/ticket/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateViaStore = (input: TicketInsertOrUpdateRequest, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'PUT',
      url: '/api/app/ticket/via-store',
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