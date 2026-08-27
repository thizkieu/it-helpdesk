import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface GetUsersInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  role?: string;
}

export interface UserDto extends EntityDto<string> {
  userName?: string;
  email?: string;
  name?: string;
  surname?: string;
  isActive: boolean;
}
