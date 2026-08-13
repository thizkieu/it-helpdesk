
export interface CreateUpdateSysMasterListDto {
  masterListID: number;
  masterListCode?: string;
  masterListGroupCde?: string;
  masterListCdeName?: string;
  mastListDefaultValue?: string;
  mastListExtendValue1?: string;
  mastListExtendValue2?: string;
  mastListExtendValue3?: string;
  mastListExtendValue4?: string;
  mastListExtendValue5?: string;
  description?: string;
  orderNo?: number;
  isActive?: boolean;
  rowVersion?: string;
}

export interface DeleteSysMasterListDto {
  masterListID: number;
  rowVersion?: string;
}

export interface GetSysMasterListInput {
  keyWord?: string;
  status?: string;
  masterListGroupCde?: string;
  pageIndex: number;
  pageSize: number;
}

export interface SysMasterListDto {
  masterListID: number;
  masterListCode?: string;
  masterListGroupCde?: string;
  masterListCdeName?: string;
  mastListDefaultValue?: string;
  mastListExtendValue1?: string;
  mastListExtendValue2?: string;
  mastListExtendValue3?: string;
  mastListExtendValue4?: string;
  mastListExtendValue5?: string;
  description?: string;
  orderNo?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  tenantId?: string;
  rowVersion?: string;
  createBy?: string;
  createDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  totalRows: number;
  totalPages: number;
  rowIndex: number;
}
