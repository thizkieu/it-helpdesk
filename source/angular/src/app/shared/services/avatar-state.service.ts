import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RestService } from '@abp/ng.core';

@Injectable({ providedIn: 'root' })
export class AvatarStateService {
  private restService = inject(RestService);
  private readonly defaultAvatar = 'assets/images/chibi/avatar (1).png';
  
  // Khởi tạo lấy ngay từ localStorage nếu có để tránh chớp giật ảnh mặc định
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
        console.warn('Không thể tải avatar từ server, dùng ảnh cache hoặc mặc định:', err);
      }
    });
  }

  updateAvatar(newUrl: string) {
    const finalUrl = newUrl.startsWith('data:') || newUrl.startsWith('http') ? newUrl : `data:image/png;base64,${newUrl}`;
    localStorage.setItem('user_avatar_cache', finalUrl);
    this.avatarSource.next(finalUrl);
  }
}