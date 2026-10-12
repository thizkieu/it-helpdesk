import type { CreateUpdateTeamDto, GetTeamListInput, TeamDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';
import type { IdentityUserDto } from '../volo/abp/identity/models';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  create = (input: CreateUpdateTeamDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeamDto>({
      method: 'POST',
      url: '/api/app/team',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/team/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeamDto>({
      method: 'GET',
      url: `/api/app/team/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetTeamListInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TeamDto>>({
      method: 'GET',
      url: '/api/app/team',
      params: { filter: input.filter, isActive: input.isActive, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getTeamMembers = (id: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IdentityUserDto[]>({
      method: 'GET',
      url: `/api/app/team/${id}/members`,
    },
    { apiName: this.apiName,...config });
  

  reassignAndDelete = (id: number, replacementId: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/team/${id}/reassign-and-delete`,
      params: { replacementId },
    },
    { apiName: this.apiName,...config });
  

  update = (id: number, input: CreateUpdateTeamDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeamDto>({
      method: 'PUT',
      url: `/api/app/team/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
}