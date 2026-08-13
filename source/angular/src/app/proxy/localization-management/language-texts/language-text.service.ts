import type { CreateUpdateLanguageTextDto, LanguageTextDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageTextService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdateLanguageTextDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageTextDto>({
      method: 'POST',
      url: '/api/app/language-text',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/language-text/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageTextDto>({
      method: 'GET',
      url: `/api/app/language-text/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<LanguageTextDto>>({
      method: 'GET',
      url: '/api/app/language-text',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateLanguageTextDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageTextDto>({
      method: 'PUT',
      url: `/api/app/language-text/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}