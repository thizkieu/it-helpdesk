
export interface CreateUpdateLanguageDto {
  cultureName?: string;
  displayName?: string;
  icon?: string;
  isDefault: boolean;
}

export interface InputLanguageDto {
  cultureName?: string;
  displayName?: string;
}

export interface LanguageDto {
  id?: string;
  cultureName?: string;
  displayName?: string;
  icon?: string;
  isDefault: boolean;
}
