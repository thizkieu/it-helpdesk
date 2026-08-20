import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateFaqDto {
  question?: string;
  answer?: string;
  category?: string;
  displayOrder: number;
}

export interface FaqItemDto extends FullAuditedEntityDto<number> {
  question?: string;
  answer?: string;
  category?: string;
  displayOrder: number;
}
