import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestService } from '@abp/ng.core';
import { CustomToastService } from '../../shared/services/custom-toast.service';
// IMPORT SERVICE VÀO ĐÂY 
import { AvatarStateService } from '../../shared/services/avatar-state.service';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <div class="card premium-glass-card border-0 shadow-lg" style="width: 100%; max-width: 500px; background: rgba(22, 22, 35, 0.95); backdrop-filter: blur(12px);">
        <div class="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-4">
          <h4 class="mb-0 text-pink fw-bold text-center"><i class="fas fa-camera-retro me-2"></i>Cài đặt Ảnh đại diện</h4>
        </div>
        <div class="card-body text-center py-5">
          <div class="position-relative d-inline-block mb-4">
            <!-- Khu vực hiển thị ảnh -->
            <img [src]="currentAvatar" 
                 class="rounded-circle shadow-lg" 
                 style="width: 180px; height: 180px; object-fit: cover; border: 4px solid #c084fc;">
            
            <div *ngIf="isUploading" class="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex justify-content-center align-items-center" style="background: rgba(0,0,0,0.6);">
              <div class="spinner-border text-pink" role="status"></div>
            </div>
          </div>
          
          <div>
            <label class="btn cute-outline-btn rounded-pill px-4 py-2 fw-semibold cursor-pointer text-pink border-pink shadow-sm">
              <i class="fas fa-upload me-2"></i> Chọn ảnh từ máy tính
              <input type="file" hidden accept="image/*" (change)="onFileSelected($event)">
            </label>
            <p class="text-muted small mt-3">Định dạng hỗ trợ: JPG, PNG, WEBP, GIF. Dung lượng tối đa: 5MB.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AvatarUploadComponent implements OnInit {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  // BƠM SERVICE VÀO COMPONENT
  private avatarState = inject(AvatarStateService); 
  
  // Sửa lại đường dẫn ảnh mặc định chuẩn xác theo đuôi .png
  currentAvatar: string = 'assets/images/chibi/avatar (1).png';
  isUploading = false;

  ngOnInit() {
    // CHỈ CẦN LẮNG NGHE SERVICE - Không cần tự gọi API '/api/app/profile/my-avatar' nữa
    this.avatarState.currentAvatar$.subscribe(url => {
      this.currentAvatar = url;
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
      // Tách bỏ phần "data:image/...;base64," để lấy nội dung chuẩn
      const base64String = (reader.result as string).split(',')[1];
      
      this.restService.request<any, void>({
        method: 'POST',
        url: '/api/app/profile/upload-avatar',
        body: {
          base64Content: base64String,
          contentType: file.type // Truyền linh hoạt loại file (image/png, image/jpeg...)
        }
      }).subscribe({
        next: () => {
          this.customToast.show('Cập nhật ảnh đại diện thành công!', 'success');
          
          // Cập nhật ảnh lên Service. Service sẽ tự động báo cho cả component này
          // VÀ báo cho Navbar góc phải cập nhật ảnh cùng 1 lúc!
          this.avatarState.updateAvatar(reader.result as string); 
          
          this.isUploading = false;
        },
        error: () => {
          this.customToast.show('Lỗi tải ảnh lên, vui lòng thử lại!', 'error');
          this.isUploading = false;
        }
      });
    };
  }
}