import { Injectable, inject } from '@angular/core';
import { ConfigStateService } from '@abp/ng.core';
import { NotificationSoundService } from './notification-sound.service';
import { CustomToastService } from './custom-toast.service'; // Tiêm thêm service hiển thị Popup
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private notificationSound = inject(NotificationSoundService);
  private customToast = inject(CustomToastService); // Khởi tạo Toast
  private config = inject(ConfigStateService);
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  public getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  public resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  public initRealTimeNotifications(): void {
    const currentUser = this.config.getOne('currentUser') as any;
    if (!currentUser) return;
    
    const existing = JSON.parse(localStorage.getItem('app_notifications') || '[]');
    this.unreadCountSubject.next(existing.length);
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:44304/signalr-hubs/ticket', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();
      
    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connected Globally!');
        this.listenToEvents();
      })
      .catch((err: any) => console.error('SignalR Error: ', err));
  }

  private listenToEvents(): void {
    this.hubConnection.on('ReceiveTicketNotification', (message: string) => {
      // 1. Phát âm thanh
      this.notificationSound.notifyAdmin('Hệ thống IT Helpdesk', message, 'warning');
      
      // 2. HIỂN THỊ POPUP THÔNG BÁO TẠI MỌI TRANG
      this.customToast.show(message, 'success');
      
      // 3. Lưu vào LocalStorage
      const existing = JSON.parse(localStorage.getItem('app_notifications') || '[]');
      existing.unshift(message);
      localStorage.setItem('app_notifications', JSON.stringify(existing));
      
      // 4. Tăng số đếm trên Chuông
      const currentCount = this.unreadCountSubject.value;
      this.unreadCountSubject.next(currentCount + 1);
    });
  }
}