import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateTeamDto {
  code: string;
  name_Vi: string;
  name_En?: string;
  managerId?: string;
  isActive: boolean;
}

export interface GetTeamListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isActive?: boolean;
}

export interface TeamDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  name_Vi?: string;
  name_En?: string;
  managerId?: string;
  isActive: boolean;
  memberCount: number;
  leadName?: string;
  openTickets: number;
}
