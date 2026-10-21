import { Component, signal } from '@angular/core';
import { CameraTabComponent } from './camera-tab/camera-tab';
import { Esp32TabComponent } from './esp32-tab/esp32-tab';

/** Trang gộp: Tab 1 Camera AI, Tab 2 ESP32 & cảm biến. */
@Component({
  selector: 'app-devices',
  imports: [CameraTabComponent, Esp32TabComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>🌡️ Thiết bị & Cảm biến</h1><p class="sub">Quản lý camera, ESP32 và dữ liệu cảm biến</p></div></div>
      <div class="tabs">
        <button [class.active]="tab() === 'camera'" (click)="tab.set('camera')">📹 Camera AI</button>
        <button [class.active]="tab() === 'esp32'" (click)="tab.set('esp32')">📡 ESP32 & Cảm biến</button>
      </div>
      @if (tab() === 'camera') { <app-camera-tab /> } @else { <app-esp32-tab /> }
    </div>`,
})
export class DevicesComponent {
  tab = signal<'camera' | 'esp32'>('camera');
}
