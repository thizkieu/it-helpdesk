import { mapEnumToOptions } from '@abp/ng.core';

export enum TicketStatus {
  New = 1,
  Assigned = 2,
  InProgress = 3,
  PendingUser = 4,
  Escalated = 5,
  Resolved = 6,
  Closed = 7,
}

export const ticketStatusOptions = mapEnumToOptions(TicketStatus);
