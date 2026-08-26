import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RestService } from '@abp/ng.core';

@Injectable({ providedIn: 'root' })
export class AvatarStateService {
  private restService = inject(RestService);
  
  // Biến này sẽ lưu giữ link ảnh hiện tại và phát tín hiệu đi toàn hệ thống
  private avatarSource = new BehaviorSubject<string>('assets/images/chibi/avatar (1).png');
  currentAvatar$ = this.avatarSource.asObservable();

  // Hàm này gọi API để lấy ảnh (chỉ gọi 1 lần khi vừa vào web)
  loadInitialAvatar() {
    this.restService.request<void, string>({
      method: 'GET',
      url: '/api/app/profile/my-avatar',
      responseType: 'text' // Trả về dạng string (Base64 hoặc URL)
    }).subscribe({
      next: (res) => {
        if (res) this.updateAvatar(res);
      },
      error: (err) => console.error('Lỗi tải ảnh đại diện:', err)
    });
  }

  // Hàm này dùng để cập nhật ảnh ngay lập tức sau khi Upload thành công
  updateAvatar(newUrl: string) {
    this.avatarSource.next(newUrl);
  }
}