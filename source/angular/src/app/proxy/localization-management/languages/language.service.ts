import type { CreateUpdateLanguageDto, InputLanguageDto, LanguageDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdateLanguageDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageDto>({
      method: 'POST',
      url: '/api/app/language',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/language/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageDto>({
      method: 'GET',
      url: `/api/app/language/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getLanguages = (input: InputLanguageDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<LanguageDto>>({
      method: 'GET',
      url: '/api/app/language/languages',
      params: { cultureName: input.cultureName, displayName: input.displayName },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<LanguageDto>>({
      method: 'GET',
      url: '/api/app/language',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateLanguageDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, LanguageDto>({
      method: 'PUT',
      url: `/api/app/language/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}