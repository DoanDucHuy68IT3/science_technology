import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { interval, startWith, switchMap } from 'rxjs';
import { CameraCountLog, DeviceMcu, SensorLog, SensorRange, Violation } from '../../core/models';
import { CameraService } from '../../core/services/camera.service';
import { DeviceService } from '../../core/services/device.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThresholdService } from '../../core/services/threshold.service';
import { ViolationService } from '../../core/services/violation.service';
import { LineChartComponent, StatCardComponent, StatusBadgeComponent, toDateStr } from '../../shared';
import { ViolationReviewModalComponent } from '../violations/violation-review-modal';

@Component({
  selector: 'app-overview',
  imports: [FormsModule, DatePipe, StatCardComponent, LineChartComponent, StatusBadgeComponent, ViolationReviewModalComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>📊 Tổng quan lớp học</h1><p class="sub">Cập nhật: {{ updated() | date: 'HH:mm:ss' }}</p></div></div>

      <div class="grid g4">
        <app-stat-card icon="👥" label="Số người" [value]="people()" hint="Phát hiện hôm nay" />
        <app-stat-card icon="⚠️" label="Vi phạm" [value]="today().length" hint="Trong ngày" tone="warn" />
        <app-stat-card icon="🔔" label="Chờ xác minh" [value]="pending()" hint="Chưa duyệt" />
        <app-stat-card icon="🌡️" label="Cảnh báo môi trường" [value]="envAlerts()" hint="Trong ngày" [tone]="envAlerts() ? 'danger' : 'ok'" />
      </div>

      <div class="row mt"><label class="f">Thiết bị ESP32
        <select [ngModel]="mcuId()" (ngModelChange)="mcuId.set(+$event); loadLogs()">@for (m of mcus(); track m.id) { <option [value]="m.id">{{ m.deviceName }}</option> }</select></label>
        <label class="f">Khoảng thời gian
        <select [ngModel]="range()" (ngModelChange)="range.set($event); loadLogs()"><option value="HOUR">1 giờ</option><option value="DAY">24 giờ</option><option value="WEEK">7 ngày</option></select></label></div>

      <div class="grid g2 mt">
        <div class="card"><h2>Nhiệt độ (°C) & Độ ẩm (%)</h2>
          <app-line-chart [labels]="labels()" [series]="[{ name: 'Nhiệt độ °C', color: '#7c3aed', values: temps() }]" />
          <app-line-chart [labels]="labels()" [series]="[{ name: 'Độ ẩm %', color: '#2563eb', values: hums() }]" /></div>
        <div class="card"><h2>Khí gas & Khói (MQ-2)</h2>
          <app-line-chart [labels]="labels()" [series]="[{ name: 'Khí gas', color: '#f59e0b', values: gases() }, { name: 'Khói', color: '#6b7280', values: smokes() }]"
            [thresholds]="[{ value: th().gasWarning, label: 'Ngưỡng gas' }, { value: th().smokeWarning, label: 'Ngưỡng khói' }]" /></div>
      </div>

      <div class="grid g2 mt">
        <div class="card env">
          <h2>Môi trường học đường</h2>
          <div class="kv"><span>🌡️ Nhiệt độ</span><b>{{ latest()?.temperature ?? '—' }} °C</b></div>
          <div class="kv"><span>💧 Độ ẩm</span><b>{{ latest()?.humidity ?? '—' }} %</b></div>
          <div class="kv"><span>💨 Khí gas</span><b>{{ latest()?.gasLevel ?? '—' }} <small>(giá trị cảm biến)</small></b></div>
          <div class="kv"><span>🌫️ Nồng độ khói</span><b>{{ latest()?.smokeLevel ?? '—' }} <small>(giá trị cảm biến)</small></b></div>
          <div class="kv"><span>Trạng thái</span><app-status-badge [status]="ev().status" /></div>
          @for (r of ev().reasons; track r) { <div class="warn-line">• {{ r }}</div> }
          <small class="muted">Cập nhật lần cuối: {{ latest()?.recordedAt | date: 'HH:mm:ss' }}. MQ-2 chưa hiệu chuẩn nên không quy đổi ppm.</small>
        </div>
        <div class="card table-wrap">
          <h2>Vi phạm gần đây</h2>
          <table class="tbl"><thead><tr><th>Thời gian</th><th>Học sinh</th><th>Loại</th><th>Trạng thái</th></tr></thead>
            <tbody>@for (v of recent(); track v.id) {
              <tr class="click" (click)="selected.set(v)"><td>{{ v.detectedAt | date: 'HH:mm' }}</td><td>{{ v.personName ?? 'Chưa nhận diện' }}</td><td>{{ v.violationTypeName }}</td><td><app-status-badge [status]="v.reviewStatus" /></td></tr>
            } @empty { <tr><td colspan="4" class="empty">Chưa có vi phạm</td></tr> }</tbody></table>
          <small class="muted">Bấm vào dòng để xem ảnh minh chứng và xác minh.</small>
        </div>
      </div>
    </div>
    @if (selected(); as s) { <app-violation-review-modal [v]="s" (closed)="selected.set(null)" (reviewed)="reloadViolations()" /> }`,
  styles: `
    .kv { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); small { font-weight: 400; color: var(--muted); } }
    .warn-line { color: var(--danger); font-size: 13px; margin-top: 6px; } .env small.muted { display: block; margin-top: 10px; }`,
})
export class OverviewComponent {
  private violationApi = inject(ViolationService);
  private deviceApi = inject(DeviceService);
  private cameraApi = inject(CameraService);
  private thresholdSvc = inject(ThresholdService);
  private rt = inject(RealtimeService);
  private settings = inject(SettingsService);
  private destroyRef = inject(DestroyRef);

  th = this.settings.thresholds;
  mcus = signal<DeviceMcu[]>([]);
  mcuId = signal(0);
  range = signal<SensorRange>('DAY');
  logs = signal<SensorLog[]>([]);
  violations = signal<Violation[]>([]);
  counts = signal<CameraCountLog[]>([]);
  selected = signal<Violation | null>(null);
  updated = signal(new Date());

  today = computed(() => this.violations().filter((v) => v.detectedAt.slice(0, 10) === toDateStr()));
  pending = computed(() => this.violations().filter((v) => v.reviewStatus === 'PENDING').length);
  recent = computed(() => this.violations().slice(0, 5));
  /** Số người lớn nhất camera ghi nhận trong ngày (theo camera_count_logs) */
  people = computed(() => Math.max(0, ...this.counts().map((c) => c.personCount)));
  latest = computed(() => this.logs().at(-1));
  ev = computed(() => this.thresholdSvc.evaluate(this.latest()));
  envAlerts = computed(() => this.logs().filter((l) => this.thresholdSvc.evaluate(l).status !== 'NORMAL').length);
  labels = computed(() => this.logs().map((l) => new Date(l.recordedAt).toTimeString().slice(0, 5)));
  temps = computed(() => this.logs().map((l) => l.temperature));
  hums = computed(() => this.logs().map((l) => l.humidity));
  gases = computed(() => this.logs().map((l) => l.gasLevel));
  smokes = computed(() => this.logs().map((l) => l.smokeLevel));

  constructor() {
    this.deviceApi.list().subscribe((m) => { this.mcus.set(m); this.mcuId.set(m[0]?.id ?? 0); this.loadLogs(); });
    this.cameraApi.counts(1).subscribe((c) => this.counts.set(c));
    interval(30000).pipe(startWith(0), switchMap(() => this.violationApi.list({ from: toDateStr(new Date(Date.now() - 6 * 864e5)) })), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => { this.violations.set(v); this.updated.set(new Date()); });
    // Realtime: cập nhật ngay khi server đẩy dữ liệu mới
    this.rt.sensor$.pipe(takeUntilDestroyed()).subscribe((s) => s.mcuId === this.mcuId() && this.logs.update((l) => [...l.slice(-200), s]));
    this.rt.violation$.pipe(takeUntilDestroyed()).subscribe((v) => this.violations.update((l) => [v, ...l]));
  }

  loadLogs(): void {
    if (this.mcuId()) this.deviceApi.sensorLogs(this.mcuId(), this.range()).subscribe((l) => this.logs.set(l));
  }
  reloadViolations(): void {
    this.violationApi.list().subscribe((v) => this.violations.set(v));
  }
}
