import type { AuditedEntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { TicketStatus } from './ticket-status.enum';

export interface AssignTicketDto {
  ticketId: number;
  assigneeId?: string;
  teamId?: number;
}

export interface CreateUpdateTicketDto {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
  serviceId: number;
}

export interface DashboardStatsDto {
  totalTickets: number;
  newTickets: number;
  unassignedTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  slaComplianceRate: number;
}

export interface GetTicketListDto extends PagedAndSortedResultRequestDto {
  filter?: string;
  status?: number;
  assigneeId?: string;
  teamId?: number;
  unassigned?: boolean;
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
  targetResponseTime?: string;
  targetResolutionTime?: string;
  isOverdue: boolean;
}

export interface TicketTimelineDto {
  type?: string;
  content?: string;
  isInternal: boolean;
  creationTime?: string;
  creatorId?: string;
  creatorName?: string;
}

export interface UploadAttachmentDto {
  ticketId: number;
  fileName: string;
  base64Content: string;
  contentType: string;
}
