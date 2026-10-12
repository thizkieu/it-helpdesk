import type { CreationAuditedEntityDto } from '@abp/ng.core';

export interface AppNotificationDto extends CreationAuditedEntityDto<string> {
  userId?: string;
  title_Vi?: string;
  title_En?: string;
  message_Vi?: string;
  message_En?: string;
  type?: string;
  isRead: boolean;
  linkUrl?: string;
  title?: string;
  message?: string;
}

export interface SendBroadcastDto {
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
}
