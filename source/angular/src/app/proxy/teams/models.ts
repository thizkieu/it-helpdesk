import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateTeamDto {
  code: string;
  name: string;
  managerId?: string;
  isActive: boolean;
}

export interface GetTeamListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}

export interface TeamDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  managerId?: string;
  isActive: boolean;
}
