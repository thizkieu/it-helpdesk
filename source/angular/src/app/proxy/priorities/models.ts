import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdatePriorityDto {
  code: string;
  name_Vi: string;
  name_En?: string;
  level: number;
  color?: string;
  isActive: boolean;
  responseMinutes: number;
  resolutionMinutes: number;
}

export interface GetPriorityListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isActive?: boolean;
}

export interface PriorityDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  name_Vi?: string;
  name_En?: string;
  level: number;
  color?: string;
  isActive: boolean;
  responseMinutes: number;
  resolutionMinutes: number;
}
