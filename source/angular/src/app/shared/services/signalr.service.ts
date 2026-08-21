import { Injectable, inject } from '@angular/core';
import { ConfigStateService } from '@abp/ng.core';
import { CustomToastService } from './custom-toast.service';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;
  private customToast = inject(CustomToastService);
  private config = inject(ConfigStateService);

  public initRealTimeNotifications(): void {
    const currentUser = this.config.getOne('currentUser');
    if (!currentUser) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/signalr-hubs/notification', {
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
      this.customToast.show(`🔔 ${message}`, 'success');
    });
  }
}