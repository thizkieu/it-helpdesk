import type { CreateUpdateSysMasterListDto, DeleteSysMasterListDto, GetSysMasterListInput, SysMasterListDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SysMasterListService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdateSysMasterListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: '/api/app/sys-master-list',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (input: DeleteSysMasterListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'DELETE',
      url: '/api/app/sys-master-list',
      params: { masterListID: input.masterListID, rowVersion: input.rowVersion },
    },
    { apiName: this.apiName,...config });
  

  getAllCde = (masterListGroupCde: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SysMasterListDto[]>({
      method: 'GET',
      url: '/api/app/sys-master-list/cde',
      params: { masterListGroupCde },
    },
    { apiName: this.apiName,...config });
  

  getById = (masterListId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SysMasterListDto>({
      method: 'GET',
      url: `/api/app/sys-master-list/by-id/${masterListId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetSysMasterListInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<SysMasterListDto>>({
      method: 'GET',
      url: '/api/app/sys-master-list',
      params: { keyWord: input.keyWord, status: input.status, masterListGroupCde: input.masterListGroupCde, pageIndex: input.pageIndex, pageSize: input.pageSize },
    },
    { apiName: this.apiName,...config });
  

  update = (input: CreateUpdateSysMasterListDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'PUT',
      url: '/api/app/sys-master-list',
      body: input,
    },
    { apiName: this.apiName,...config });
}