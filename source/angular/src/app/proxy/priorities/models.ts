import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdatePriorityDto {
  code: string;
  name: string;
  level: number;
  color?: string;
  isActive: boolean;
  responseMinutes: number;
  resolutionMinutes: number;
}

export interface GetPriorityListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}

export interface PriorityDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  level: number;
  color?: string;
  isActive: boolean;
  responseMinutes: number;
  resolutionMinutes: number;
}
