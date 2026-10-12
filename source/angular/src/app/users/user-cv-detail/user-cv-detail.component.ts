import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestService, AuthService, ConfigStateService, LocalizationService, LocalizationPipe } from '@abp/ng.core';
import { ActivatedRoute } from '@angular/router';
import { CustomToastService } from '../../shared/services/custom-toast.service';

@Component({
  selector: 'app-user-cv-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LocalizationPipe],
  templateUrl: './user-cv-detail.component.html',
  styleUrls: ['./user-cv-detail.component.scss']
})
export class UserCvDetailComponent implements OnInit {
  private restService = inject(RestService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toast = inject(CustomToastService);
  private authService = inject(AuthService);
  private config = inject(ConfigStateService);
  public localizationService = inject(LocalizationService);
  
  userId: string | null = null;
  userData: any = null;
  isLoading = true;
  isSaving = false;
  
  isInternalStaff = false; 
  activeTab: 'overview' | 'skills' | 'settings' = 'overview';
  completionRate: number = 0;
  
  cvData = {
    photoUrl: '/assets/images/chibi/avatar (1).png', // Đã sửa thành ảnh mặc định tồn tại
    jobTitle: '',
    department: '',
    address: '',
    skills: '',
    bio: '',
    dateOfBirth: '',
    allowNotifications: true,
    publicProfile: false,
    twoFactorEnabled: false
  };

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (!this.userId) {
        const currentUser = this.config.getOne('currentUser');
        this.userId = currentUser?.id ?? null; 
    }
    if (this.userId) {
      this.loadUserProfileAndRoles();
    }
  }

  loadUserProfileAndRoles(): void {
    this.isLoading = true;
    this.restService.request<any, any>({
      method: 'GET',
      url: `/api/identity/users/${this.userId}`
    }).subscribe({
      next: (userRes: any) => {
        this.userData = userRes;
        const extras = userRes.extraProperties || {};
        
        // Nhận diện ảnh thật hoặc ảnh mặc định từ CSDL
        let dbPhoto = extras.CV_PhotoUrl;
        if (!dbPhoto) {
            dbPhoto = '/assets/images/chibi/avatar (1).png';
        } else if (!dbPhoto.startsWith('http') && !dbPhoto.startsWith('data:') && !dbPhoto.startsWith('/assets/')) {
            dbPhoto = `data:image/jpeg;base64,${dbPhoto}`;
        }

        this.cvData = {
          photoUrl: dbPhoto,
          jobTitle: extras.CV_JobTitle || '',
          department: extras.CV_Department || '',
          address: extras.CV_Address || '',
          skills: extras.CV_Skills || '',
          bio: extras.CV_Bio || '',
          dateOfBirth: extras.CV_DateOfBirth ? extras.CV_DateOfBirth.split('T')[0] : '',
          allowNotifications: extras.CV_AllowNotif !== false,
          publicProfile: extras.CV_PublicProfile === true,
          twoFactorEnabled: extras.CV_2FA === true
        };
        this.calculateCompletionRate();
        
        this.restService.request<any, any>({
          method: 'GET',
          url: `/api/identity/users/${this.userId}/roles`
        }).subscribe({
          next: (roleRes: any) => {
            const roles = roleRes.items ? roleRes.items.map((r: any) => r.name.toLowerCase()) : [];
            this.isInternalStaff = roles.some((r: string) => 
                r.includes('admin') || r.includes('technician') || r.includes('manager') || r.includes('staff') || r.includes('it')
            );
            this.isLoading = false;
          },
          error: () => this.isLoading = false
        });
      },
      error: () => this.isLoading = false
    });
  }

  calculateCompletionRate(): void {
    const fieldsToTrack = [
      this.userData?.name,
      this.userData?.phoneNumber,
      this.cvData.jobTitle,
      this.cvData.department,
      this.cvData.address,
      this.cvData.skills,
      this.cvData.bio,
      this.cvData.dateOfBirth
    ];
    const filledFields = fieldsToTrack.filter(field => field && field.trim() !== '').length;
    this.completionRate = Math.round((filledFields / fieldsToTrack.length) * 100);
  }

  // ĐÃ SỬA: Chuẩn hóa logic gọi API Upload Avatar Base64 đúng theo ProfileAppService
  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          this.toast.show('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB', 'error');
          return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        
        // Gọi API của ProfileAppService thay vì FileManagement bị lỗi 405
        this.restService.request<any, void>({
          method: 'POST',
          url: '/api/app/profile/upload-avatar', 
          body: {
              base64Content: base64String,
              contentType: file.type
          }
        }).subscribe({
          next: () => {
             this.cvData.photoUrl = reader.result as string; 
             this.calculateCompletionRate();
             this.toast.show(this.localizationService.instant('ItHelpdesk::Avatar:AvatarSuccess') || 'Cập nhật ảnh đại diện thành công!', 'success');
          },
          error: () => {
             this.toast.show('Có lỗi xảy ra khi cập nhật ảnh.', 'error');
          }
        });
      };
    }
  }

  setTab(tab: 'overview' | 'skills' | 'settings'): void {
      this.activeTab = tab;
  }

  toggleSetting(setting: 'allowNotifications' | 'publicProfile' | 'twoFactorEnabled'): void {
      this.cvData[setting] = !this.cvData[setting];
  }

  saveProfileInfo(): void {
    this.isSaving = true;
    this.calculateCompletionRate();
    
    let photoDataToSave = this.cvData.photoUrl;
    if (photoDataToSave.startsWith('data:image')) {
        photoDataToSave = photoDataToSave.split(',')[1];
    }

    const updatedUser = {
      ...this.userData,
      extraProperties: {
        ...this.userData.extraProperties,
        CV_PhotoUrl: photoDataToSave,
        CV_JobTitle: this.cvData.jobTitle,
        CV_Department: this.cvData.department,
        CV_Address: this.cvData.address,
        CV_Skills: this.cvData.skills,
        CV_Bio: this.cvData.bio,
        CV_DateOfBirth: this.cvData.dateOfBirth,
        CV_AllowNotif: this.cvData.allowNotifications,
        CV_PublicProfile: this.cvData.publicProfile,
        CV_2FA: this.cvData.twoFactorEnabled
      }
    };
    
    this.restService.request<any, any>({
      method: 'PUT',
      url: `/api/identity/users/${this.userId}`,
      body: updatedUser
    }).subscribe({
      next: () => {
        this.toast.show(this.localizationService.instant('ItHelpdesk::UserCv:UpdateSuccess'), 'success');
        this.isSaving = false;
      },
      error: () => {
        this.toast.show(this.localizationService.instant('ItHelpdesk::UserCv:UpdateError'), 'error');
        this.isSaving = false;
      }
    });
  }

  logout(): void {
    if(confirm(this.localizationService.instant('ItHelpdesk::UserCv:ConfirmLogout'))) {
        this.authService.logout();
    }
  }

  goBack(): void {
    this.location.back();
  }
}