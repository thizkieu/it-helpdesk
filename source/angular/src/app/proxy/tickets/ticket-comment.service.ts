import type { TicketCommentDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TicketCommentService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  getListByTicketId = (ticketId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketCommentDto[]>({
      method: 'GET',
      url: `/api/app/ticket-comment/by-ticket-id/${ticketId}`,
    },
    { apiName: this.apiName,...config });
}