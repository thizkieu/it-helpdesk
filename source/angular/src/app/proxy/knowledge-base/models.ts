import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateFaqDto {
  question_Vi: string;
  question_En?: string;
  answer_Vi: string;
  answer_En?: string;
  category: string;
  displayOrder: number;
  icon?: string;
  isActive: boolean;
}

export interface FaqItemDto extends FullAuditedEntityDto<number> {
  question?: string;
  answer?: string;
  question_Vi?: string;
  question_En?: string;
  answer_Vi?: string;
  answer_En?: string;
  category?: string;
  displayOrder: number;
  icon?: string;
}
