import { Component, OnInit, inject } from '@angular/core';
import { DynamicLayoutComponent, ReplaceableComponentsService, ConfigStateService, SessionStateService, LocalizationService } from '@abp/ng.core';
import { LoaderBarComponent } from '@abp/ng.theme.shared';
import { AvatarStateService } from './shared/services/avatar-state.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { eIdentityComponents } from '@abp/ng.identity';
import { UsersComponent } from './users/users.component';
import { SignalRService } from './shared/services/signalr.service';

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
  private replaceableComponents = inject(ReplaceableComponentsService);
  public signalRService = inject(SignalRService);
  private configState = inject(ConfigStateService);
  private sessionState = inject(SessionStateService);
  private localizationService = inject(LocalizationService); // Inject LocalizationService

  private lastAvatarUrl: string = '';

  ngOnInit() {
    this.sessionState.setLanguage('vi');

    this.signalRService.initRealTimeNotifications();

    this.replaceableComponents.add({
      component: UsersComponent,
      key: eIdentityComponents.Users,
    });

    this.avatarState.loadInitialAvatar();

    this.avatarState.currentAvatar$.subscribe(avatarUrl => {
      this.lastAvatarUrl = avatarUrl;
      this.injectAvatarToNavbar(avatarUrl);
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.lastAvatarUrl) {
        this.injectAvatarToNavbar(this.lastAvatarUrl);
      }
    });

    this.listenToRealTimeNotifications();
  }

  private listenToRealTimeNotifications() {
    if (this.signalRService.unreadCount$) {
      this.signalRService.unreadCount$.subscribe((count: number) => {
        const badge = document.getElementById('notif-badge');
        const icon = document.getElementById('bell-icon-inner');

        if (badge && icon) {
          if (count > 0) {
            badge.innerText = count > 99 ? '99+' : count.toString();
            badge.style.display = 'block';
            icon.classList.add('bell-ringing');
          } else {
            badge.style.display = 'none';
            icon.classList.remove('bell-ringing');
          }
        }
      });
    }
  }

  private injectAvatarToNavbar(avatarUrl: string) {
    setTimeout(() => {
      const currentUser = this.configState.getOne('currentUser') as any;
      if (!currentUser || !currentUser.id) {
        document.querySelector('#global-notification-bell')?.remove();
        document.querySelector('#my-global-avatar')?.remove();
        return;
      }

      const userMenuWrapper = document.querySelector('div[ngbdropdowntoggle], .dropdown-toggle.lpx-user-profile');

      if (userMenuWrapper) {
        (userMenuWrapper as HTMLElement).style.cssText = 'display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 8px !important; text-decoration: none !important;';

        const defaultIcons = userMenuWrapper.querySelectorAll('lpx-avatar, i.bi-person-circle, svg, img:not(#my-global-avatar)');
        defaultIcons.forEach(icon => (icon as HTMLElement).style.display = 'none');

        let imgObj = userMenuWrapper.querySelector('#my-global-avatar') as HTMLImageElement;
        if (!imgObj) {
          imgObj = document.createElement('img');
          imgObj.id = 'my-global-avatar';
          imgObj.style.cssText = 'width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; margin: 0; flex-shrink: 0;';
          userMenuWrapper.insertBefore(imgObj, userMenuWrapper.firstChild);
        }
        imgObj.src = avatarUrl ? avatarUrl : '/assets/images/default-avatar.png';

        const parentContainer = userMenuWrapper.parentElement;

        if (parentContainer) {
          parentContainer.style.cssText = 'display: inline-flex !important; flex-direction: row !important; align-items: center !important; gap: 16px !important;';

          let bellIcon = parentContainer.querySelector('#global-notification-bell') as HTMLElement;
          if (!bellIcon) {
            bellIcon = document.createElement('div');
            bellIcon.id = 'global-notification-bell';
            bellIcon.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; height: 100%; margin: 0; padding: 0;';

            // Lấy chuỗi dịch thuật động qua LocalizationService
            const tooltipTitle = this.localizationService.instant('ItHelpdesk::Notification:SystemTitle');

            bellIcon.innerHTML = `
              <a href="/notifications" 
                 id="bell-link"
                 style="position: relative; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; width: 34px; height: 34px;"
                 title="${tooltipTitle}">
                 
                <i id="bell-icon-inner" class="fas fa-bell bell-hover-glow" style="font-size: 1.25rem; color: #94a3b8; display: block; line-height: 1; cursor: pointer;"></i>
                
                <span id="notif-badge" class="badge rounded-pill pulse-animation" 
                    style="position: absolute; top: -2px; right: -4px; background-color: #ef4444; font-size: 0.6rem; padding: 3px 5px; display: none; color: white; border: 2px solid white; line-height: 1;">
                  0
                </span>
              </a>
            `;
            parentContainer.insertBefore(bellIcon, userMenuWrapper);

            if (typeof this.signalRService['getUnreadCount'] === 'function') {
              const initialCount = (this.signalRService as any).getUnreadCount();
              if (initialCount > 0) {
                const badge = document.getElementById('notif-badge');
                const icon = document.getElementById('bell-icon-inner');
                if (badge) { badge.innerText = initialCount.toString(); badge.style.display = 'block'; }
                if (icon) icon.classList.add('bell-ringing');
              }
            }
          }
        }
      }
    }, 200);
  }
}