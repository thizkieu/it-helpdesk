import { mapEnumToOptions } from '@abp/ng.core';

export enum TicketStatus {
  New = 0,
  Assigned = 1,
  InProgress = 2,
  PendingUser = 3,
  Escalated = 4,
  Resolved = 5,
  Completed = 6,
  Closed = 7,
}

export const ticketStatusOptions = mapEnumToOptions(TicketStatus);
