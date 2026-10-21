import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification, RealtimeMessage, SensorLog, Violation } from '../models';
import { AuthService } from './auth.service';
import { ThresholdService } from './threshold.service';

/**
 * Kết nối WebSocket tới Spring Boot: nhận dữ liệu cảm biến, cảnh báo AI, trạng thái thiết bị.
 * Có tự kết nối lại. Khi useMock = true thì không mở kết nối.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private auth = inject(AuthService);
  private threshold = inject(ThresholdService);
  private ws?: WebSocket;
  private retry?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private seq = 1;

  readonly connected = signal(false);
  readonly notifications = signal<AppNotification[]>([]);
  readonly unread = () => this.notifications().filter((n) => !n.read).length;

  readonly sensor$ = new Subject<SensorLog>();
  readonly violation$ = new Subject<Violation>();

  connect(): void {
    if (environment.useMock || this.ws || !this.auth.user()) return;
const wsUrl = `${environment.wsUrl}?userId=${this.auth.user()?.id}`;
    this.stopped = false;
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => this.connected.set(true);
    this.ws.onmessage = (e) => this.handle(e.data);
    this.ws.onclose = () => {
      this.connected.set(false);
      this.ws = undefined;
      if (!this.stopped) this.retry = setTimeout(() => this.connect(), 3000);
    };
    this.ws.onerror = () => this.ws?.close();
  }

  disconnect(): void {
    this.stopped = true;
    clearTimeout(this.retry);
    this.ws?.close();
    this.ws = undefined;
  }

  markAllRead(): void {
    this.notifications.update((l) => l.map((n) => ({ ...n, read: true })));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private handle(raw: string): void {
    let msg: RealtimeMessage;
    try { msg = JSON.parse(raw); } catch { return; }
    switch (msg.type) {
      case 'SENSOR': {
        this.sensor$.next(msg.payload);
        const ev = this.threshold.evaluate(msg.payload);
        if (ev.status !== 'NORMAL') this.notify('ENVIRONMENT', `Cảnh báo môi trường: ${ev.reasons.join(', ')}`);
        break;
      }
      case 'VIOLATION':
        this.violation$.next(msg.payload);
        this.notify('VIOLATION', `${msg.payload.violationTypeName} - ${msg.payload.personName ?? 'Chưa nhận diện'}`);
        break;
      case 'DEVICE_STATUS':
        this.notify('DEVICE', `Thiết bị #${msg.payload.id} ${msg.payload.status === 'ONLINE' ? 'đã kết nối' : 'mất kết nối'}`);
        break;
    }
  }

  private notify(kind: AppNotification['kind'], title: string): void {
    this.notifications.update((l) => [{ id: this.seq++, kind, title, time: new Date().toISOString(), read: false }, ...l].slice(0, 50));
  }
}
