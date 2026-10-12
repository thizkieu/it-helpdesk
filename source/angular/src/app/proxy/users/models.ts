import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface GetUsersInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  role?: string;
  isActive?: boolean;
}

export interface UserDto extends EntityDto<string> {
  userName?: string;
  email?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
  isActive: boolean;
  roleNames: string[];
}
