import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateServiceDto {
  code: string;
  name: string;
  categoryId: number;
  description?: string;
  isActive: boolean;
}

export interface GetServiceListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}

export interface ServiceDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  categoryId: number;
  description?: string;
  isActive: boolean;
}
