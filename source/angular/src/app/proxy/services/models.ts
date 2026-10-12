import type { AuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateServiceDto {
  code: string;
  name_Vi: string;
  name_En?: string;
  categoryId: number;
  description_Vi?: string;
  description_En?: string;
  isActive: boolean;
}

export interface GetServiceListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isActive?: boolean;
}

export interface ServiceDto extends AuditedEntityDto<number> {
  code?: string;
  name?: string;
  description?: string;
  name_Vi?: string;
  name_En?: string;
  description_Vi?: string;
  description_En?: string;
  categoryId: number;
  isActive: boolean;
}
