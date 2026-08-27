import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateFaqDto {
  question?: string;
  answer?: string;
  category?: string;
  displayOrder: number;
  icon?: string;
}

export interface FaqItemDto extends FullAuditedEntityDto<number> {
  question?: string;
  answer?: string;
  category?: string;
  displayOrder: number;
  icon?: string;
}
