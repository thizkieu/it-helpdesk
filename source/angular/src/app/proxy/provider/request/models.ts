
export interface TicketDeleteRequest {
  id: number;
}

export interface TicketInfoRequest {
  id: number;
}

export interface TicketInsertOrUpdateRequest {
  id?: number;
  title?: string;
  description?: string;
  categoryId: number;
  priorityId: number;
  serviceId: number;
  status: number;
  assigneeId?: string;
  teamId?: number;
  dueDate?: string;
}

export interface TicketListRequest {
  filterText?: string;
  status?: number;
  categoryId?: number;
  priorityId?: number;
  assigneeId?: string;
  teamId?: number;
  unassigned?: boolean;
  creatorId?: string;
  pageIndex: number;
  pageSize: number;
  tenantId?: string;
  isOverdue?: boolean;
}

export interface TicketReportRequest {
  fromDate?: string;
  toDate?: string;
}
