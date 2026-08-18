import type { AuditedEntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { TicketStatus } from './ticket-status.enum';

export interface CreateTicketCommentDto {
  ticketId: number;
  content: string;
  isInternal: boolean;
}

export interface CreateUpdateTicketDto {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
  serviceId: number;
}

export interface GetTicketListDto extends PagedAndSortedResultRequestDto {
  filter?: string;
  status?: number;
}

export interface TicketCommentDto extends AuditedEntityDto<number> {
  ticketId: number;
  content?: string;
  isInternal: boolean;
}

export interface TicketDto extends FullAuditedEntityDto<number> {
  ticketNo?: string;
  title?: string;
  description?: string;
  categoryId: number;
  priorityId: number;
  serviceId: number;
  status?: TicketStatus;
  assigneeId?: string;
  teamId?: number;
  dueDate?: string;
  resolvedAt?: string;
}
