import type { CreateUpdatePriorityDto, GetPriorityListInput, PriorityDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PriorityService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdatePriorityDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PriorityDto>({
      method: 'POST',
      url: '/api/app/priority',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/priority/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PriorityDto>({
      method: 'GET',
      url: `/api/app/priority/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetPriorityListInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<PriorityDto>>({
      method: 'GET',
      url: '/api/app/priority',
      params: { filter: input.filter, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdatePriorityDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PriorityDto>({
      method: 'PUT',
      url: `/api/app/priority/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}