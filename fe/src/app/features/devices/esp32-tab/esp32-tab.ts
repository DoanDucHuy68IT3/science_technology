import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceMcu, SensorLog, SensorRange } from '../../../core/models';
import { DeviceService } from '../../../core/services/device.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ThresholdService } from '../../../core/services/threshold.service';
import { LineChartComponent, ModalComponent, StatusBadgeComponent, TimeAgoPipe } from '../../../shared';
import { AiAssistantModalComponent } from '../ai-assistant-modal/ai-assistant-modal';

@Component({
  selector: 'app-esp32-tab',
  imports: [FormsModule, DatePipe, ModalComponent, StatusBadgeComponent, TimeAgoPipe, LineChartComponent, AiAssistantModalComponent],
  template: `
    <div class="row" style="margin-bottom:12px"><span class="spacer muted">{{ rows().length }} thiết bị</span>
      <button class="btn" (click)="ai.set(true)">🤖 Trợ lý AI</button><button class="btn primary" (click)="edit(null)">+ Thêm ESP32</button></div>

    <div class="card table-wrap">
      <table class="tbl">
        <thead><tr><th>Thiết bị</th><th>MAC</th><th>Trạng thái</th><th>Nhiệt độ</th><th>Độ ẩm</th><th>Gas</th><th>Khói</th><th>Môi trường</th><th></th></tr></thead>
        <tbody>
          @for (d of rows(); track d.id) {
            <tr [class.sel]="d.id === selectedId()">
              <td><b>{{ d.deviceName }}</b><br /><small class="muted">{{ d.location }}</small></td><td>{{ d.macAddress }}</td>
              <td><app-status-badge [status]="d.status" /><br /><small class="muted">{{ d.lastSeen | timeAgo }}</small></td>
              <td>{{ d.latest?.temperature ?? '—' }}</td><td>{{ d.latest?.humidity ?? '—' }}</td><td>{{ d.latest?.gasLevel ?? '—' }}</td><td>{{ d.latest?.smokeLevel ?? '—' }}</td>
              <td><app-status-badge [status]="th.evaluate(d.latest).status" /></td>
              <td class="row"><button class="btn sm" (click)="select(d)">Lịch sử</button><button class="btn sm" (click)="edit(d)">Sửa</button><button class="btn sm danger" (click)="remove(d)">Xóa</button></td>
            </tr>
          } @empty { <tr><td colspan="9" class="empty">Chưa có thiết bị</td></tr> }
        </tbody>
      </table>
    </div>

    @if (selectedId()) {
      <div class="card mt">
        <div class="row"><h2 class="spacer">Lịch sử dữ liệu & cảnh báo</h2>
          <select [ngModel]="range()" (ngModelChange)="range.set($event); loadLogs()"><option value="HOUR">1 giờ</option><option value="DAY">24 giờ</option><option value="WEEK">7 ngày</option></select></div>
        <div class="grid g2">
          <app-line-chart [labels]="labels()" [series]="[{ name: 'Nhiệt độ °C', color: '#7c3aed', values: temps() }, { name: 'Độ ẩm %', color: '#2563eb', values: hums() }]" />
          <app-line-chart [labels]="labels()" [series]="[{ name: 'Gas', color: '#f59e0b', values: gas() }, { name: 'Khói', color: '#6b7280', values: smoke() }]"
            [thresholds]="[{ value: cfg().gasWarning, label: 'Ngưỡng gas' }]" />
        </div>
        <h3 class="mt">Cảnh báo vượt ngưỡng ({{ alerts().length }})</h3>
        <div class="table-wrap" style="max-height:220px;overflow:auto"><table class="tbl"><thead><tr><th>Thời gian</th><th>Mức</th><th>Nội dung</th></tr></thead>
          <tbody>@for (a of alerts().slice(0, 30); track a.log.id) { <tr><td>{{ a.log.recordedAt | date: 'dd/MM HH:mm' }}</td><td><app-status-badge [status]="a.status" /></td><td>{{ a.reasons }}</td></tr> }
            @empty { <tr><td colspan="3" class="empty">Không có cảnh báo</td></tr> }</tbody></table></div>
      </div>
    }

    @if (form(); as f) {
      <app-modal [title]="f.id ? 'Sửa ESP32' : 'Thêm ESP32'" (closed)="form.set(null)">
        <div class="form-grid">
          <label class="f">Tên thiết bị<input [(ngModel)]="f.deviceName" /></label>
          <label class="f">Địa chỉ MAC<input [(ngModel)]="f.macAddress" placeholder="24:6F:28:AA:BB:01" /></label>
          <label class="f full">Vị trí lắp đặt<input [(ngModel)]="f.location" /></label>
        </div>
        <div footer><button class="btn" (click)="form.set(null)">Hủy</button><button class="btn primary" [disabled]="!f.deviceName || !validMac(f.macAddress)" (click)="save(f)">Lưu</button></div>
      </app-modal>
    }
    @if (ai()) { <app-ai-assistant-modal [mcuId]="selectedId() || undefined" (closed)="ai.set(false)" /> }`,
  styles: `tr.sel { background: var(--p-50); }`,
})
export class Esp32TabComponent {
  private api = inject(DeviceService);
  th = inject(ThresholdService);
  cfg = inject(SettingsService).thresholds;
  rows = signal<DeviceMcu[]>([]);
  form = signal<Partial<DeviceMcu> | null>(null);
  ai = signal(false);
  selectedId = signal(0);
  range = signal<SensorRange>('DAY');
  logs = signal<SensorLog[]>([]);

  labels = computed(() => this.logs().map((l) => new Date(l.recordedAt).toTimeString().slice(0, 5)));
  temps = computed(() => this.logs().map((l) => l.temperature));
  hums = computed(() => this.logs().map((l) => l.humidity));
  gas = computed(() => this.logs().map((l) => l.gasLevel));
  smoke = computed(() => this.logs().map((l) => l.smokeLevel));
  alerts = computed(() =>
    this.logs().map((log) => ({ log, ...this.th.evaluate(log) })).filter((x) => x.status !== 'NORMAL').map((x) => ({ log: x.log, status: x.status, reasons: x.reasons.join(', ') })).reverse(),
  );

  constructor() { 
    console.log('[Esp32Tab] Component initialized');
    this.load(); 
  }

  load(): void { 
    console.log('[Esp32Tab] Loading device list...');
    this.api.list().subscribe({
      next: (r) => {
        console.log('[Esp32Tab] Devices loaded successfully:', r);
        this.rows.set(r);
      },
      error: (err) => console.error('[Esp32Tab] Error loading devices:', err)
    }); 
  }

  select(d: DeviceMcu): void { 
    console.log('[Esp32Tab] Selected device:', d);
    this.selectedId.set(d.id); 
    this.loadLogs(); 
  }

  loadLogs(): void { 
    console.log(`[Esp32Tab] Loading sensor logs for device ID: ${this.selectedId()} with range: ${this.range()}`);
    this.api.sensorLogs(this.selectedId(), this.range()).subscribe({
      next: (l) => {
        console.log('[Esp32Tab] Sensor logs loaded:', l);
        this.logs.set(l);
      },
      error: (err) => console.error('[Esp32Tab] Error loading sensor logs:', err)
    }); 
  }

  validMac = (m?: string) => {
    const isValid = !!m && /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(m);
    return isValid;
  };

  edit(d: DeviceMcu | null): void { 
    console.log('[Esp32Tab] Edit modal opened with data:', d);
    this.form.set(d ? { ...d } : { deviceName: '', macAddress: '', location: '' }); 
  }

  save(f: Partial<DeviceMcu>): void { 
    console.log('[Esp32Tab] Saving device data:', f);
    this.api.save(f).subscribe({
      next: (res) => {
        console.log('[Esp32Tab] Device saved successfully:', res);
        this.form.set(null); 
        this.load();
      },
      error: (err) => console.error('[Esp32Tab] Error saving device:', err)
    }); 
  }

  remove(d: DeviceMcu): void {
    console.log('[Esp32Tab] Requesting removal for device:', d);
    if (confirm(`Xóa thiết bị ${d.deviceName}?`)) {
      this.api.remove(d.id).subscribe({
        next: () => {
          console.log('[Esp32Tab] Device removed successfully, ID:', d.id);
          if (this.selectedId() === d.id) {
            console.log('[Esp32Tab] Resetting selectedId because active device was deleted');
            this.selectedId.set(0);
          } 
          this.load();
        },
        error: (err) => console.error('[Esp32Tab] Error removing device:', err)
      });
    } else {
      console.log('[Esp32Tab] Device removal cancelled by user');
    }
  }
}
