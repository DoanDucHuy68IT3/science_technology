import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CameraDevice, Violation, ViolationFilter, ViolationType, REVIEW_LABEL } from '../../core/models';
import { ViolationService } from '../../core/services/violation.service';
import { BarChartComponent, ConfidencePipe, StatCardComponent, StatusBadgeComponent, addDays, exportCsv, toDateStr } from '../../shared';
import { ViolationReviewModalComponent } from './violation-review-modal';

@Component({
  selector: 'app-violations',
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, StatCardComponent, StatusBadgeComponent, BarChartComponent, ConfidencePipe, ViolationReviewModalComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div><h1>⚠️ Vi phạm</h1><p class="sub">Theo dõi và xử lý các sự kiện do AI ghi nhận</p></div>
        <button class="btn" (click)="export()">⬇ Xuất CSV</button>
      </div>

      <div class="card filters">
        <label class="f">Từ ngày<input type="date" [(ngModel)]="from" (ngModelChange)="load()" /></label>
        <label class="f">Đến ngày<input type="date" [(ngModel)]="to" (ngModelChange)="load()" /></label>
        <label class="f">Loại vi phạm
          <select [(ngModel)]="typeId" (ngModelChange)="load()"><option [ngValue]="undefined">Tất cả</option>@for (t of types(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }</select></label>
        <label class="f">Camera
          <select [(ngModel)]="cameraId" (ngModelChange)="load()"><option [ngValue]="undefined">Tất cả</option>@for (c of cameras(); track c.id) { <option [ngValue]="c.id">{{ c.cameraName }}</option> }</select></label>

        <!-- Đồng bộ giá trị theo ReviewStatus: PENDING, VERIFIED, REJECTED -->
        <label class="f">Trạng thái
          <select [(ngModel)]="status" (ngModelChange)="load()">
            <option [ngValue]="undefined">Tất cả</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="VERIFIED">Đã xác minh</option>
            <option value="REJECTED">Đã bác bỏ</option>
          </select>
        </label>
        <label class="f grow">Tìm học sinh / loại<input [(ngModel)]="keyword" placeholder="Tên, mã HS..." /></label>
      </div>

      <div class="grid g4 mt">
        <app-stat-card icon="⚠️" label="Tổng vi phạm" [value]="rows().length" />
        <app-stat-card icon="🔔" label="Chờ duyệt" [value]="count('PENDING')" tone="warn" />
        <app-stat-card icon="✅" label="Đã xác minh" [value]="count('VERIFIED')" tone="ok" />
        <app-stat-card icon="🚫" label="Đã bác bỏ" [value]="count('REJECTED')" />
      </div>

      <div class="grid g2 mt">
        <div class="card"><h2>Số vi phạm theo ngày</h2><app-bar-chart [data]="byDay()" /></div>
        <div class="card"><h2>Cơ cấu theo loại</h2><app-bar-chart [data]="byType()" /></div>
      </div>

      <div class="card mt table-wrap">
        <table class="tbl">
          <thead><tr><th>Ảnh</th><th>Thời gian</th><th>Học sinh</th><th>Loại vi phạm</th><th>Camera</th><th>Độ tin cậy</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            @for (v of shown(); track v.id) {
              <tr class="click" (click)="selected.set(v)">
                <td>
                  @if (v.imageUrl) {
                    <img [src]="getImageUrl(v.imageUrl)" alt="thumb" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;" />
                  } @else {
                    <span class="muted">Không</span>
                  }
                </td>
                <td>{{ v.detectedAt | date: 'dd/MM HH:mm' }}</td>
                <td>{{ v.personName ?? 'Chưa nhận diện' }}</td>
                <td>{{ v.violationTypeName }}</td>
                <td>{{ v.cameraName }}</td>
                <td>{{ v.confidence | confidence }}</td>
                <td><app-status-badge [status]="v.reviewStatus" /></td>
                <td><button class="btn sm">Xem</button></td>
              </tr>
            } @empty { <tr><td colspan="8" class="empty">Không có sự kiện phù hợp</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
    @if (selected(); as s) { <app-violation-review-modal [v]="s" (closed)="selected.set(null)" (reviewed)="load()" /> }`,
  styles: `.filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; } .grow { flex: 1; min-width: 160px; }`,
})
export class ViolationsComponent {
  private api = inject(ViolationService);
  q = input<string>();

  types = signal<ViolationType[]>([]);
  cameras = signal<CameraDevice[]>([]);
  rows = signal<Violation[]>([]);
  selected = signal<Violation | null>(null);
  from = toDateStr(addDays(new Date(), -7));
  to = toDateStr();
  typeId?: number;
  cameraId?: number;
  status?: ViolationFilter['reviewStatus'];
  keyword = '';

  shown = computed(() => {
    const k = (this.keyword || this.q() || '').toLowerCase().trim();
    return k ? this.rows().filter((v) => [v.personName, v.personCode, v.violationTypeName].some((x) => x?.toLowerCase().includes(k))) : this.rows();
  });

  count = (s: string) => this.rows().filter((v) => v.reviewStatus === s).length;
  byType = computed(() => this.group((v) => v.violationTypeName));
  byDay = computed(() => this.group((v) => v.detectedAt.slice(5, 10).split('-').reverse().join('/')));

  constructor() {
    this.api.types().subscribe((t) => this.types.set(t));
    this.loadCameras();
    this.load();
  }

  /** Gộp camera từ nhiều key localStorage, loại trùng theo id */
  private loadCameras(): void {
    const map = new Map<number, CameraDevice>();
    for (const key of ['allCamerasHls', 'cameras', 'active_camera']) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        (Array.isArray(parsed) ? parsed : [parsed]).forEach((c: CameraDevice) => {
          if (c?.id != null) map.set(c.id, c);
        });
      } catch (e) {
        console.error(`Không đọc được localStorage["${key}"]`, e);
      }
    }
    this.cameras.set([...map.values()]);
  }

  load(): void {
    this.api.list({
      violationTypeId: this.typeId,
      cameraId: this.cameraId,
      reviewStatus: this.status,
      from: this.from,
      to: this.to,
    }).subscribe({
      next: (data: Violation[]) => {
        this.rows.set(Array.isArray(data) ? data : []);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách vi phạm:', err);
        this.rows.set([]);
      },
    });
  }

  getImageUrl(path?: string | null): string {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    const clean = path.replace(/^\/+/, '').replace(/^images\//, '');
    return `http://localhost:8080/images/${clean}`;
  }

  export(): void {
    exportCsv('vi-pham', ['Thời gian', 'Học sinh', 'Mã HS', 'Loại', 'Camera', 'Độ tin cậy', 'Trạng thái', 'Ghi chú'],
      this.shown().map((v) => [v.detectedAt, v.personName, v.personCode, v.violationTypeName, v.cameraName, Math.round(v.confidence * 100) + '%', REVIEW_LABEL[v.reviewStatus] || v.reviewStatus, v.reviewNote]));
  }

  private group(key: (v: Violation) => string) {
    const m = new Map<string, number>();
    this.shown().forEach((v) => m.set(key(v), (m.get(key(v)) ?? 0) + 1));
    return [...m].map(([label, value]) => ({ label, value }));
  }
}