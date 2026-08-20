import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CustomToastService {
    toasts: any[] = [];

    show(message: string, type: 'success' | 'error' = 'success') {
        const id = Date.now();
        this.toasts.push({ id, message, type });
        // Thông báo tự tắt sau 3 giây
        setTimeout(() => this.remove(id), 3000);
    }

    remove(id: number) {
        this.toasts = this.toasts.filter(t => t.id !== id);
    }
}