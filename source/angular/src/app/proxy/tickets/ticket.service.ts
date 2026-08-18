import type { CreateUpdateTicketDto, GetTicketListDto, TicketDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private restService = inject(RestService);
  apiName = 'Default';
  

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
  

  getList = (input: GetTicketListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TicketDto>>({
      method: 'GET',
      url: '/api/app/ticket',
      params: { filter: input.filter, status: input.status, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdateTicketDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TicketDto>({
      method: 'PUT',
      url: `/api/app/ticket/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}