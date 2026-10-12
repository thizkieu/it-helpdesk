import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestService, CoreModule, LocalizationService } from '@abp/ng.core';
import { ConfirmationService, Confirmation, ThemeSharedModule } from '@abp/ng.theme.shared';
import { CustomToastService } from '../../shared/services/custom-toast.service';
import { AvatarStateService } from '../../shared/services/avatar-state.service';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule, CoreModule, ThemeSharedModule],
  templateUrl: './avatar-upload.component.html',
  styleUrls: ['./avatar-upload.component.scss']
})
export class AvatarUploadComponent implements OnInit {
  private restService = inject(RestService);
  private customToast = inject(CustomToastService);
  private avatarState = inject(AvatarStateService);
  public localizationService = inject(LocalizationService);
  private confirmation = inject(ConfirmationService);
  
  currentAvatar: string = '';
  isUploading = false;
  isDeleting = false;
  
  get isDefaultAvatar(): boolean {
    return !this.currentAvatar || this.currentAvatar.includes('assets/images/chibi');
  }
  
  ngOnInit() {
    this.avatarState.currentAvatar$.subscribe(url => {
      if (url) {
        this.currentAvatar = url;
      }
    });
  }
  
  handleImageError() {
    const randomAvatarIndex = Math.floor(Math.random() * 29) + 1;
    this.currentAvatar = `/assets/images/chibi/avatar (${randomAvatarIndex}).png`;
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
    const confirmTitle = this.localizationService.instant('ItHelpdesk::ConfirmAction');
    this.confirmation.warn(confirmMsg, confirmTitle).subscribe((status: Confirmation.Status) => {
      if (status === Confirmation.Status.confirm) {
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
            this.restService.request<any, string>({
              method: 'GET',
              url: '/api/app/profile/my-avatar'
            }).subscribe(res => {
              if (res) {
                this.avatarState.updateAvatar(res);
              }
            });
            this.isDeleting = false;
          },
          error: () => {
            const failMsg = this.localizationService.instant('ItHelpdesk::Error:Generic');
            this.customToast.show(failMsg, 'error');
            this.isDeleting = false;
          }
        });
      }
    });
  }
}