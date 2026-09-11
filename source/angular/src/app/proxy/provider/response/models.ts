
export interface TicketListQueryResponse {
  id: number;
  ticketNo?: string;
  title?: string;
  description?: string;
  categoryId: number;
  priorityId: number;
  serviceId: number;
  status: number;
  assigneeId?: string;
  teamId?: number;
  dueDate?: string;
  resolvedAt?: string;
  targetResponseTime?: string;
  targetResolutionTime?: string;
  isOverdue: boolean;
  creationTime?: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
  isDeleted: boolean;
  deleterId?: string;
  deletionTime?: string;
}

export interface TicketReportResponse {
  status: number;
  totalCount: number;
}
