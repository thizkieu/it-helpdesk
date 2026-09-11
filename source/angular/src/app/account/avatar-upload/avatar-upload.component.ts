import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestService, CoreModule, LocalizationService } from '@abp/ng.core';
import { CustomToastService } from '../../shared/services/custom-toast.service';
import { AvatarStateService } from '../../shared/services/avatar-state.service';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule, CoreModule],
  template: `
    <div class="container d-flex justify-content-center align-items-center min-vh-100 py-5 text-white">
      <div class="card premium-glass-card border-0 shadow-lg animate-fade-in rounded-4" style="width: 100%; max-width: 500px; background: rgba(23, 28, 48, 0.85); backdrop-filter: blur(20px);">
        
        <div class="card-header bg-transparent border-bottom border-secondary border-opacity-25 py-4 text-center position-relative">
          <span class="badge cute-badge-pill mb-2 px-3 py-2" style="background: rgba(192, 132, 252, 0.15); border: 1px dashed rgba(192, 132, 252, 0.45); color: #c084fc;">
            <i class="fas fa-camera-retro me-1"></i> {{ 'ItHelpdesk::Avatar:HeaderBadge' | abpLocalization }}
          </span>
          <h4 class="mb-0 text-white fw-bold">
            {{ 'ItHelpdesk::Avatar:SettingsTitle' | abpLocalization }}
          </h4>
        </div>
        
        <div class="card-body text-center py-5">
          <div class="position-relative d-inline-block mb-4">
            <img [src]="currentAvatar" 
                 class="rounded-circle shadow-lg avatar-image" 
                 style="width: 180px; height: 180px; object-fit: cover; border: 4px solid #c084fc;"
                 (error)="handleImageError()">
            
            <div *ngIf="isUploading" class="position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex justify-content-center align-items-center" style="background: rgba(0,0,0,0.6);">
              <div class="spinner-border text-pink" role="status"></div>
            </div>
            
            <button *ngIf="!isDefaultAvatar && !isUploading" 
                    class="btn btn-danger rounded-circle position-absolute bottom-0 end-0 shadow-sm d-flex justify-content-center align-items-center"
                    style="width: 40px; height: 40px;"
                    [title]="'ItHelpdesk::Delete' | abpLocalization"
                    (click)="deleteAvatar()">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          
          <div class="mt-2">
            <label class="btn cute-outline-btn rounded-pill px-4 py-2 fw-semibold cursor-pointer text-pink border-pink shadow-sm upload-btn-hover"
                   [class.disabled]="isUploading">
              <i class="fas fa-upload me-2" [class.fa-spin]="isUploading"></i> {{ 'ItHelpdesk::Avatar:SelectButton' | abpLocalization }}
              <input type="file" hidden accept="image/jpeg, image/png, image/webp, image/gif" (change)="onFileSelected($event)" [disabled]="isUploading">
            </label>
            
            <p class="text-muted small mt-4 opacity-75 fw-medium">
              <i class="fas fa-info-circle me-1"></i> {{ 'ItHelpdesk::Avatar:SupportText' | abpLocalization }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AvatarUploadComponent implements OnInit {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private avatarState = inject(AvatarStateService); 
  private localizationService = inject(LocalizationService);

  readonly DEFAULT_AVATAR = '/assets/images/chibi/avatar (1).png';
  currentAvatar: string = this.DEFAULT_AVATAR;
  isUploading = false;
  isDeleting = false;

  get isDefaultAvatar(): boolean {
    return !this.currentAvatar || this.currentAvatar.includes('assets/images/chibi');
  }

  ngOnInit() {
    this.avatarState.currentAvatar$.subscribe(url => {
      this.currentAvatar = url || this.DEFAULT_AVATAR;
    });
  }

  handleImageError() {
    this.currentAvatar = this.DEFAULT_AVATAR;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = this.localizationService.instant('ItHelpdesk::Error:AvatarTooLarge');
      this.customToast.show(errorMsg, 'error');
      event.target.value = '';
      return;
    }

    const selectMsg = this.localizationService.instant('ItHelpdesk::Toast:ImageSelected');
    this.customToast.show(selectMsg, 'success');

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
          const successMsg = this.localizationService.instant('ItHelpdesk::Toast:AvatarSuccess');
          this.customToast.show(successMsg, 'success');
          this.avatarState.updateAvatar(reader.result as string); 
          this.isUploading = false;
        },
        error: () => {
          const failMsg = this.localizationService.instant('ItHelpdesk::Error:AvatarUploadFailed');
          this.customToast.show(failMsg, 'error');
          this.isUploading = false;
        }
      });
    };
  }

  deleteAvatar() {
    const confirmMsg = this.localizationService.instant('ItHelpdesk::AreYouSureToDelete');
    if (!confirm(confirmMsg)) return;

    this.isDeleting = true;
    const deletingMsg = this.localizationService.instant('ItHelpdesk::Toast:Deleting');
    this.customToast.show(deletingMsg, 'success');

    this.restService.request<void, void>({
      method: 'DELETE',
      url: '/api/app/profile/avatar' 
    }).subscribe({
      next: () => {
        const successMsg = this.localizationService.instant('ItHelpdesk::Toast:DeleteSuccess');
        this.customToast.show(successMsg, 'success');
        this.avatarState.updateAvatar(this.DEFAULT_AVATAR); 
        this.isDeleting = false;
      },
      error: () => {
        const failMsg = this.localizationService.instant('ItHelpdesk::Error:Generic');
        this.customToast.show(failMsg, 'error');
        this.isDeleting = false;
      }
    });
  }
}