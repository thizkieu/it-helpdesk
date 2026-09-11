import type { CreationAuditedEntityDto } from '@abp/ng.core';

export interface AppNotificationDto extends CreationAuditedEntityDto<string> {
  userId?: string;
  title?: string;
  message?: string;
  type?: string;
  isRead: boolean;
  linkUrl?: string;
}

export interface SendBroadcastDto {
  title?: string;
  message?: string;
  type?: string;
}
