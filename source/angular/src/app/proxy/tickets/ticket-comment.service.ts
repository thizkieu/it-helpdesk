import type { CreateTicketCommentDto, TicketCommentDto } from './models';
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
  

  getListByTicketId = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketCommentDto[]>({
      method: 'GET',
      url: `/api/app/ticket-comment/by-ticket-id/${ticketId}`,
    },
    { apiName: this.apiName,...config });
}