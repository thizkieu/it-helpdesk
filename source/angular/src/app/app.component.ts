import { Component, OnInit, inject } from '@angular/core';
// 1. IMPORT THÊM ReplaceableComponentsService
import { DynamicLayoutComponent, ReplaceableComponentsService } from '@abp/ng.core'; 
import { LoaderBarComponent } from '@abp/ng.theme.shared';
import { AvatarStateService } from './shared/services/avatar-state.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
// 2. IMPORT THÊM eIdentityComponents VÀ UsersComponent
import { eIdentityComponents } from '@abp/ng.identity'; 
import { UsersComponent } from './users/users.component'; // Đảm bảo đường dẫn này trỏ đúng tới component của bạn

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar />
    <abp-dynamic-layout />
  `,
  imports: [LoaderBarComponent, DynamicLayoutComponent],
  standalone: true
})
export class AppComponent implements OnInit {
  private avatarState = inject(AvatarStateService);
  private router = inject(Router);
  
  // 3. KHAI BÁO SERVICE GHI ĐÈ
  private replaceableComponents = inject(ReplaceableComponentsService); 
  
  private lastAvatarUrl: string = '';

  ngOnInit() {
    // ==========================================================
    // 4. LỆNH GHI ĐÈ TRANG QUẢN LÝ NGƯỜI DÙNG MẶC ĐỊNH CỦA ABP
    // ==========================================================
    this.replaceableComponents.add({
      component: UsersComponent,
      key: eIdentityComponents.Users,
    });
    // ==========================================================

    // 1. Gắn CSS "tiêu diệt" icon mặc định của ABP Theme vĩnh viễn
    this.injectGlobalStyles();

    // 2. Tải ảnh từ API ngay khi mở app
    this.avatarState.loadInitialAvatar();

    // 3. Lắng nghe thay đổi state ảnh để chèn vào Navbar
    this.avatarState.currentAvatar$.subscribe(avatarUrl => {
      this.lastAvatarUrl = avatarUrl;
      this.injectAvatarToNavbar(avatarUrl);
    });

    // 4. Lắng nghe sự kiện chuyển trang
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.lastAvatarUrl) {
        this.injectAvatarToNavbar(this.lastAvatarUrl);
      }
    });
  }

  // Bơm CSS toàn cục để ẩn triệt để icon xám
  private injectGlobalStyles() {
    if (!document.getElementById('hide-default-avatar-style')) {
      const style = document.createElement('style');
      style.id = 'hide-default-avatar-style';
      style.innerHTML = `
        abp-current-user i,
        abp-current-user svg,
        abp-current-user img:not(#my-global-avatar),
        abp-current-user-image,
        .lpx-nav-user i,
        .lpx-nav-user svg,
        .lpx-user-profile i
        {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private injectAvatarToNavbar(avatarUrl: string) {
    setTimeout(() => {
      const userMenus = document.querySelectorAll(
        'abp-current-user, .lpt-user-menu, .lpx-nav-user, .lpx-user-profile'
      );

      if (userMenus.length > 0) {
        userMenus.forEach(userMenu => {
          let imgObj = userMenu.querySelector('#my-global-avatar') as HTMLImageElement;

          if (!imgObj) {
            imgObj = document.createElement('img');
            imgObj.id = 'my-global-avatar';
            imgObj.style.width = '32px';
            imgObj.style.height = '32px';
            imgObj.style.borderRadius = '50%';
            imgObj.style.objectFit = 'cover';
            imgObj.style.border = '2px solid #c084fc';
            imgObj.style.flexShrink = '0';
            imgObj.style.marginRight = '8px';

            const toggleBtn = userMenu.querySelector('a.dropdown-toggle, [data-bs-toggle="dropdown"]');
            if (toggleBtn) {
              toggleBtn.prepend(imgObj);
              (toggleBtn as HTMLElement).style.display = 'flex';
              (toggleBtn as HTMLElement).style.alignItems = 'center';
            } else {
              userMenu.prepend(imgObj);
              (userMenu as HTMLElement).style.display = 'flex';
              (userMenu as HTMLElement).style.alignItems = 'center';
            }
          }

          if (imgObj.src !== avatarUrl) {
            imgObj.src = avatarUrl;
          }

          // TỰ ĐỘNG CHÈN THÊM MỤC "ĐỔI ẢNH ĐẠI DIỆN" VÀO DROPDOWN MENU
          const dropdownMenu = userMenu.querySelector('.dropdown-menu, .lpx-user-dropdown-menu');
          if (dropdownMenu && !dropdownMenu.querySelector('#custom-avatar-menu-item')) {
            const customMenuLi = document.createElement('li');
            customMenuLi.id = 'custom-avatar-menu-item';
            customMenuLi.innerHTML = `
              <a class="dropdown-item d-flex align-items-center gap-2" href="/profile-avatar" style="cursor: pointer;">
                <i class="fas fa-camera-retro text-pink"></i>
                <span>Đổi ảnh đại diện</span>
              </a>
            `;
            dropdownMenu.prepend(customMenuLi);
          }
        });
      }
    }, 200);
  }
}