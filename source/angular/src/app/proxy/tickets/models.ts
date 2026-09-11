import type { TicketStatus } from './ticket-status.enum';
import type { AuditedEntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface AssignTicketDto {
  ticketId: number;
  assigneeId?: string;
  teamId?: number;
}

export interface ChangeTicketStatusInput {
  ticketId: number;
  newStatus?: TicketStatus;
  comment?: string;
}

export interface CreateTicketCommentDto {
  ticketId: number;
  parentId?: number;
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
  isMyTickets?: boolean;
  isOverdue?: boolean;
}

export interface TicketCommentDto extends AuditedEntityDto<number> {
  ticketId: number;
  parentId?: number;
  content?: string;
  isInternal: boolean;
  creatorName?: string;
  userAvatar?: string;
  userRole?: string;
  replies: TicketCommentDto[];
}

export interface TicketDto extends FullAuditedEntityDto<number> {
  ticketNo?: string;
  title?: string;
  description?: string;
  categoryId: number;
  categoryName?: string;
  priorityId: number;
  priorityName?: string;
  serviceId: number;
  serviceName?: string;
  status?: TicketStatus;
  assigneeId?: string;
  teamId?: number;
  dueDate?: string;
  resolvedAt?: string;
  targetResponseTime?: string;
  targetResolutionTime?: string;
  isOverdue: boolean;
  creatorName?: string;
}

export interface TicketTimelineDto {
  id?: number;
  parentId?: number;
  type?: string;
  content?: string;
  isInternal: boolean;
  creationTime?: string;
  creatorId?: string;
  creatorName?: string;
  replies: TicketTimelineDto[];
}

export interface UpdateTicketCommentDto {
  content: string;
  isInternal: boolean;
}

export interface UploadAttachmentDto {
  ticketId: number;
  fileName: string;
  base64Content: string;
  contentType: string;
}
