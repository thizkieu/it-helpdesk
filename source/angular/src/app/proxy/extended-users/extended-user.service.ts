import type { ExtendedUserDto, GetExtendedUserListInput } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExtendedUserService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  getList = (input: GetExtendedUserListInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExtendedUserDto>>({
      method: 'GET',
      url: '/api/app/extended-user',
      params: { filter: input.filter, roleId: input.roleId, isActive: input.isActive, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
}