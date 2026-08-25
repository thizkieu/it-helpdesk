import type { UploadAvatarDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private restService = inject(RestService);
  apiName = 'Default';
  

  getMyAvatar = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'GET',
      responseType: 'text',
      url: '/api/app/profile/my-avatar',
    },
    { apiName: this.apiName,...config });
  

  uploadAvatar = (input: UploadAvatarDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/profile/upload-avatar',
      body: input,
    },
    { apiName: this.apiName,...config });
}