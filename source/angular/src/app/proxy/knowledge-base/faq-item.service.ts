import type { CreateUpdateFaqDto, FaqItemDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FaqItemService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdateFaqDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FaqItemDto>({
      method: 'POST',
      url: '/api/app/faq-item',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/faq-item/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FaqItemDto>({
      method: 'GET',
      url: `/api/app/faq-item/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<FaqItemDto>>({
      method: 'GET',
      url: '/api/app/faq-item',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdateFaqDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FaqItemDto>({
      method: 'PUT',
      url: `/api/app/faq-item/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}