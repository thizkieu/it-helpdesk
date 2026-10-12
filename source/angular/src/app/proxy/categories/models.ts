import type { FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CategoryDto extends FullAuditedEntityDto<number> {
  code?: string;
  name?: string;
  name_Vi?: string;
  name_En?: string;
  parentId?: number;
  isActive: boolean;
  defaultTeamId?: number;
}

export interface CreateUpdateCategoryDto {
  code: string;
  name_Vi: string;
  name_En?: string;
  parentId?: number;
  isActive: boolean;
  defaultTeamId?: number;
}

export interface GetCategoryListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isActive?: boolean;
}
