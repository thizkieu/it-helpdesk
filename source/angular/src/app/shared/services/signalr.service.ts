import { Injectable, inject } from '@angular/core';
import { ConfigStateService } from '@abp/ng.core';
import { NotificationSoundService } from './notification-sound.service';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private notificationSound = inject(NotificationSoundService);
  private config = inject(ConfigStateService);

  // 1. Quản lý trạng thái số lượng thông báo (Khởi tạo là 0)
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // 2. Hàm trả về số lượng hiện tại
  public getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  // 3. Hàm reset số lượng (Gọi hàm này khi người dùng bấm vào xem thông báo)
  public resetUnreadCount(): void {
    this.unreadCountSubject.next(0);
  }

  public initRealTimeNotifications(): void {
    const currentUser = this.config.getOne('currentUser') as any;
    if (!currentUser) return;

    // Load lại số đếm từ LocalStorage khi F5 trang (Nếu có)
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
        console.log('SignalR Connected Successfully!');
        this.listenToEvents();
      })
      .catch((err: any) => console.error('Error while starting SignalR connection: ', err));
  }

  private listenToEvents(): void {
    this.hubConnection.on('ReceiveTicketNotification', (message: string) => {
      // Gọi service âm thanh và phát thông báo đẩy trực quan
      this.notificationSound.notifyAdmin('Hệ thống IT Helpdesk', message, 'warning');
      
      // Lưu lại lịch sử
      const existing = JSON.parse(localStorage.getItem('app_notifications') || '[]');
      existing.unshift(message);
      localStorage.setItem('app_notifications', JSON.stringify(existing));

      // 4. TĂNG SỐ ĐẾM THÔNG BÁO CHƯA ĐỌC LÊN 1
      const currentCount = this.unreadCountSubject.value;
      this.unreadCountSubject.next(currentCount + 1);
    });
  }
}