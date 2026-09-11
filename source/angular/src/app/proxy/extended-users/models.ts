import type { IdentityUserDto } from '../volo/abp/identity/models';
import type { PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface ExtendedUserDto extends IdentityUserDto {
  roleNames: string[];
}

export interface GetExtendedUserListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  roleId?: string;
  isActive?: boolean;
}
