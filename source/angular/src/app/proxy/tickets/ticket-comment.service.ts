import type { CreateTicketCommentDto, TicketCommentDto, UpdateTicketCommentDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TicketCommentService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateTicketCommentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketCommentDto>({
      method: 'POST',
      url: '/api/app/ticket-comment',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/ticket-comment/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getListByTicketId = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketCommentDto[]>({
      method: 'GET',
      url: `/api/app/ticket-comment/by-ticket-id/${ticketId}`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: UpdateTicketCommentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketCommentDto>({
      method: 'PUT',
      url: `/api/app/ticket-comment/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}