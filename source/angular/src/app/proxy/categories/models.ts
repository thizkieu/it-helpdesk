import type { FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CategoryDto extends FullAuditedEntityDto<number> {
  code?: string;
  name?: string;
  parentId?: number;
  isActive: boolean;
  defaultTeamId?: number;
}

export interface CreateUpdateCategoryDto {
  code: string;
  name: string;
  parentId?: number;
  isActive: boolean;
  defaultTeamId?: number;
}

export interface GetCategoryListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}
