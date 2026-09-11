import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationSoundService {

  notifyAdmin(title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): void {
    // Phát âm thanh thông báo qua Web Audio API
    this.playBeepSound();
  }

  private playBeepSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Nốt D5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e: any) {
      // Ép kiểu any để loại bỏ hoàn toàn lỗi unknown
      console.warn('AudioContext warning:', e?.message || e);
    }
  }
}