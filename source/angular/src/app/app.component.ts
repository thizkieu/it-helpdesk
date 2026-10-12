import { Component, OnInit, OnDestroy, inject, NgZone, Renderer2 } from '@angular/core';
import { DynamicLayoutComponent, ReplaceableComponentsService, ConfigStateService, LocalizationService } from '@abp/ng.core';
import { LoaderBarComponent } from '@abp/ng.theme.shared';
import { AvatarStateService } from './shared/services/avatar-state.service';
import { SignalRService } from './shared/services/signalr.service';
import { eIdentityComponents } from '@abp/ng.identity';
import { UsersComponent } from './users/users.component';

@Component({
  selector: 'app-root',
  template: `
    <abp-loader-bar></abp-loader-bar>
    <abp-dynamic-layout></abp-dynamic-layout>
  `,
  imports: [LoaderBarComponent, DynamicLayoutComponent],
  standalone: true
})
export class AppComponent implements OnInit, OnDestroy {
  private avatarState = inject(AvatarStateService); 
  private replaceableComponents = inject(ReplaceableComponentsService);
  public signalRService = inject(SignalRService);
  private configState = inject(ConfigStateService);
  private localizationService = inject(LocalizationService); 
  private ngZone = inject(NgZone);
  private renderer = inject(Renderer2);
  
  private lastAvatarUrl: string = '';
  private observer: MutationObserver | null = null;

  ngOnInit() {
    this.signalRService.initRealTimeNotifications();
    
    this.replaceableComponents.add({
      component: UsersComponent,
      key: eIdentityComponents.Users,
    });
    
    this.avatarState.loadInitialAvatar();
    this.avatarState.currentAvatar$.subscribe((avatarUrl: string) => {
      this.lastAvatarUrl = avatarUrl;
    });
    
    this.listenToRealTimeNotifications();
    this.setupSafeDomObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupSafeDomObserver() {
    this.ngZone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => {
        if (this.lastAvatarUrl && !document.getElementById('my-global-avatar')) {
          this.injectAvatarAndBellToNavbar(this.lastAvatarUrl);
        }
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  private listenToRealTimeNotifications() {
    if (this.signalRService.unreadCount$) {
      this.signalRService.unreadCount$.subscribe((count: number) => {
        this.ngZone.runOutsideAngular(() => {
            const badge = document.getElementById('notif-badge');
            const icon = document.getElementById('bell-icon-inner');
            if (badge && icon) {
                if (count > 0) {
                    badge.innerText = count > 99 ? '99+' : count.toString();
                    badge.style.display = 'block';
                    icon.classList.add('bell-ringing'); // Hiệu ứng lắc chuông
                } else {
                    badge.style.display = 'none';
                    icon.classList.remove('bell-ringing');
                }
            }
        });
      });
    }
  }

  private injectAvatarAndBellToNavbar(avatarUrl: string) {
    const currentUser = this.configState.getOne('currentUser') as any;
    if (!currentUser || !currentUser.id) return;
    
    const userMenuWrapper = document.querySelector('div[ngbdropdowntoggle], .dropdown-toggle.lpx-user-profile');
    if (!userMenuWrapper) return;
    
    // Gắn Avatar
    this.renderer.setStyle(userMenuWrapper, 'display', 'inline-flex');
    this.renderer.setStyle(userMenuWrapper, 'flexDirection', 'row');
    this.renderer.setStyle(userMenuWrapper, 'alignItems', 'center');
    this.renderer.setStyle(userMenuWrapper, 'gap', '10px');
    
    const defaultIcons = userMenuWrapper.querySelectorAll('lpx-avatar, i.bi-person-circle, svg, img:not(#my-global-avatar)');
    defaultIcons.forEach(icon => this.renderer.setStyle(icon, 'display', 'none'));
    
    let imgObj = userMenuWrapper.querySelector('#my-global-avatar') as HTMLImageElement;
    if (!imgObj) {
      imgObj = this.renderer.createElement('img');
      this.renderer.setAttribute(imgObj, 'id', 'my-global-avatar');
      this.renderer.setStyle(imgObj, 'width', '34px');
      this.renderer.setStyle(imgObj, 'height', '34px');
      this.renderer.setStyle(imgObj, 'borderRadius', '50%');
      this.renderer.setStyle(imgObj, 'objectFit', 'cover');
      this.renderer.setStyle(imgObj, 'border', '2px solid rgba(56, 189, 248, 0.6)');
      this.renderer.setStyle(imgObj, 'flexShrink', '0');
      this.renderer.insertBefore(userMenuWrapper, imgObj, userMenuWrapper.firstChild);
    }
    if (imgObj.src !== avatarUrl) {
        imgObj.src = avatarUrl;
    }
    
    // GẮN CHUÔNG THÔNG BÁO GLOBAL
    const parentContainer = userMenuWrapper.parentElement;
    if (parentContainer) {
      this.renderer.setStyle(parentContainer, 'display', 'inline-flex');
      this.renderer.setStyle(parentContainer, 'alignItems', 'center');
      this.renderer.setStyle(parentContainer, 'gap', '16px');
      
      let bellIcon = parentContainer.querySelector('#global-notification-bell');
      
      if (!bellIcon) {
        if (!document.getElementById('bell-dynamic-style')) {
            const style = this.renderer.createElement('style');
            this.renderer.setAttribute(style, 'id', 'bell-dynamic-style');
            // CSS: Màu Trắng sáng nhạt, rung lắc -> Đỏ rực
            this.renderer.setProperty(style, 'innerHTML', `
                @keyframes globalRingShake {
                    0% { transform: rotate(0); }
                    10% { transform: rotate(15deg); }
                    20% { transform: rotate(-15deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-10deg); }
                    50% { transform: rotate(5deg); }
                    60% { transform: rotate(-5deg); }
                    70%, 100% { transform: rotate(0); }
                }
                #bell-link { background: transparent !important; border: none !important; box-shadow: none !important; }
                
                /* Trạng thái bình thường: Trắng xám sáng, dễ nhìn */
                #bell-icon-inner { color: #e2e8f0 !important; text-shadow: 0 1px 3px rgba(0,0,0,0.5) !important; transition: all 0.3s ease; }
                
                /* Khi có thông báo hoặc Hover: Đỏ phát sáng */
                #bell-link:hover #bell-icon-inner, #bell-icon-inner.bell-ringing {
                    color: #ef4444 !important; 
                    filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.9)) !important;
                    animation: globalRingShake 1.5s infinite ease-in-out !important;
                }
                #bell-link:hover { background: rgba(239, 68, 68, 0.1) !important; border-radius: 50%; }
            `);
            this.renderer.appendChild(document.head, style);
        }
        
        bellIcon = this.renderer.createElement('div');
        this.renderer.setAttribute(bellIcon, 'id', 'global-notification-bell');
        this.renderer.setStyle(bellIcon, 'display', 'inline-flex');
        this.renderer.setStyle(bellIcon, 'alignItems', 'center');
        
        const tooltipTitle = this.localizationService.instant('ItHelpdesk::Notification:SystemTitle') || 'Thông báo';
        
        this.renderer.setProperty(bellIcon, 'innerHTML', `
          <a href="/notifications" id="bell-link" style="position: relative; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; width: 38px; height: 38px; border-radius: 50%; transition: all 0.3s ease;" title="${tooltipTitle}">
            <i id="bell-icon-inner" class="fas fa-bell" style="font-size: 1.25rem; display: block; line-height: 1; cursor: pointer;"></i>
            <span id="notif-badge" class="badge rounded-pill" style="position: absolute; top: -4px; right: -4px; background: linear-gradient(135deg, #ef4444, #f43f5e); font-size: 0.65rem; padding: 4px 6px; display: none; color: white; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); line-height: 1;">0</span>
          </a>
        `);
        
        this.renderer.insertBefore(parentContainer, bellIcon, userMenuWrapper);
        
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
}