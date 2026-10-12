import type { TicketStatus } from './ticket-status.enum';
import type { AuditedEntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface AssignTicketDto {
  ticketId: number;
  assigneeId?: string;
  teamId?: number;
}

export interface ChartItemDto {
  name?: string;
  value: number;
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
  parentTicketId?: number;
}

export interface DashboardStatsDto {
  totalTickets: number;
  newTickets: number;
  unassignedTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  slaComplianceRate: number;
  smartInsights: string[];
  statusDistribution: ChartItemDto[];
}

export interface GetDashboardStatsInput {
  startDate?: string;
  endDate?: string;
  assigneeId?: string;
  status?: TicketStatus;
  teamId?: number;
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

export interface SlaGaugeCalculationExplanationDto {
  finalScore: number;
  totalCompletedTickets: number;
  onTimeCount: number;
  overdueCount: number;
  rawComplianceRate: number;
  formulaDescription?: string;
  breakdownLogs: string[];
}

export interface TechnicianKpiDto {
  id?: string;
  name?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  roleName?: string;
  teamName?: string;
  totalAssigned: number;
  inProgressTickets: number;
  resolvedOnTime: number;
  overdueTickets: number;
  onTimeRate: number;
  overdueRate: number;
  baseSalary: number;
  bonusAmount: number;
  penaltyAmount: number;
  netSalary: number;
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
  assigneeName?: string;
  teamId?: number;
  dueDate?: string;
  resolvedAt?: string;
  targetResponseTime?: string;
  targetResolutionTime?: string;
  isOverdue: boolean;
  creatorName?: string;
  parentTicketId?: number;
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
  creatorAvatar?: string;
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
