import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RestService, LocalizationService } from '@abp/ng.core';

@Injectable({ providedIn: 'root' })
export class AvatarStateService {
  private restService = inject(RestService);
  private localizationService = inject(LocalizationService); // Dùng đa ngôn ngữ
  
  // Thêm dấu / để chuẩn hóa link tuyệt đối
  private readonly defaultAvatar = '/assets/images/chibi/avatar (1).png';
  
  private avatarSource = new BehaviorSubject<string>(localStorage.getItem('user_avatar_cache') || this.defaultAvatar);
  currentAvatar$ = this.avatarSource.asObservable();

  loadInitialAvatar() {
    this.restService.request<void, string>({
      method: 'GET',
      url: '/api/app/profile/my-avatar',
      responseType: 'text'
    }).subscribe({
      next: (res) => {
        if (res && res.trim() !== '') {
          this.updateAvatar(res);
        }
      },
      error: (err) => {
        const errorMsg = this.localizationService.instant('ItHelpdesk::AvatarLoadError') || 'Cannot load avatar from server.';
        console.warn(errorMsg, err);
      }
    });
  }

  updateAvatar(newUrl: string) {
    let finalUrl = newUrl;
    
    // ĐÃ FIX: Nhận diện nếu API C# trả về link ảnh chibi mặc định (không bọc Base64)
    if (newUrl.startsWith('assets/') || newUrl.startsWith('/assets/')) {
        finalUrl = newUrl.startsWith('/') ? newUrl : '/' + newUrl;
    } else {
        // Nếu là mã ảnh thật do User up lên thì mới bọc Base64
        finalUrl = newUrl.startsWith('data:') || newUrl.startsWith('http') ? newUrl : `data:image/png;base64,${newUrl}`;
    }

    localStorage.setItem('user_avatar_cache', finalUrl);
    this.avatarSource.next(finalUrl);
  }
}