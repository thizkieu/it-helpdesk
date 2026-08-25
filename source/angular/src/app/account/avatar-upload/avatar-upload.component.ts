import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestService } from '@abp/ng.core';
import { CustomToastService } from '../../shared/services/custom-toast.service';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card premium-glass-card border-0 shadow-sm mt-3" style="background: rgba(22, 22, 35, 0.95); backdrop-filter: blur(12px);">
      <div class="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-3">
        <h5 class="mb-0 text-pink fw-bold"><i class="fas fa-camera-retro me-2"></i>Ảnh đại diện cá nhân</h5>
      </div>
      <div class="card-body text-center py-5">
        <div class="position-relative d-inline-block mb-4">
          <img [src]="currentAvatar" 
               class="rounded-circle shadow-lg" 
               style="width: 160px; height: 160px; object-fit: cover; border: 4px solid #c084fc;">
          
          <div *ngIf="isUploading" class="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex justify-content-center align-items-center" style="background: rgba(0,0,0,0.6);">
            <div class="spinner-border text-pink" role="status"></div>
          </div>
        </div>
        
        <div>
          <label class="btn cute-outline-btn rounded-pill px-4 fw-semibold cursor-pointer text-pink border-pink">
            <i class="fas fa-upload me-2"></i> Tải ảnh mới lên
            <input type="file" hidden accept="image/*" (change)="onFileSelected($event)">
          </label>
          <p class="text-muted small mt-3">Định dạng hỗ trợ: JPG, PNG. Khuyên dùng ảnh vuông.</p>
        </div>
      </div>
    </div>
  `
})
export class AvatarUploadComponent implements OnInit {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  
  currentAvatar: string = 'assets/images/avatar/default-avatar.png';
  isUploading = false;

  ngOnInit() {
    this.loadMyAvatar();
  }

  loadMyAvatar() {
    this.restService.request<void, string>({
      method: 'GET',
      url: '/api/app/profile/my-avatar',
      responseType: 'text'
    }).subscribe(res => {
      if (res) this.currentAvatar = res;
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.customToast.show('File ảnh quá lớn, vui lòng chọn file dưới 5MB.', 'error');
      return;
    }

    this.isUploading = true;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      
      this.restService.request<any, void>({
        method: 'POST',
        url: '/api/app/profile/upload-avatar',
        body: {
          base64Content: base64String,
          contentType: file.type
        }
      }).subscribe({
        next: () => {
          this.customToast.show('Cập nhật ảnh đại diện thành công!', 'success');
          this.currentAvatar = reader.result as string;
          this.isUploading = false;
          // Thông báo cho component Header biết để nó cũng đổi ảnh góc phải màn hình
          window.dispatchEvent(new Event('avatarChanged')); 
        },
        error: () => {
          this.customToast.show('Lỗi tải ảnh lên, vui lòng thử lại!', 'error');
          this.isUploading = false;
        }
      });
    };
  }
}