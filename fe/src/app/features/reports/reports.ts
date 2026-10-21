import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceLog, AttendanceTrend, SESSION_LABEL, SensorLog, Violation } from '../../core/models';
import { AttendanceService } from '../../core/services/attendance.service';
import { DeviceService } from '../../core/services/device.service';
import { AiQuality, ReportService } from '../../core/services/report.service';
import { BarChartComponent, StatCardComponent, addDays, exportCsv, toDateStr } from '../../shared';

type Tab = 'attendance' | 'late' | 'violations' | 'environment' | 'ai';

@Component({
  selector: 'app-reports',
  imports: [FormsModule, DatePipe, BarChartComponent, StatCardComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>📈 Báo cáo</h1><p class="sub">Tổng hợp theo khoảng thời gian, xuất Excel/CSV</p></div>
        <div class="row"><label class="f">Từ<input type="date" [(ngModel)]="from" (ngModelChange)="load()" /></label><label class="f">Đến<input type="date" [(ngModel)]="to" (ngModelChange)="load()" /></label>
          <button class="btn primary" (click)="export()">⬇ Xuất CSV</button></div></div>

      <div class="tabs">@for (t of tabs; track t.k) { <button [class.active]="tab() === t.k" (click)="tab.set(t.k)">{{ t.l }}</button> }</div>

      @switch (tab()) {
        @case ('attendance') {
          <div class="card"><h2>Tỷ lệ chuyên cần theo ngày (%)</h2><app-bar-chart [data]="trendBars()" /></div>
        }
        @case ('late') {
          <div class="card table-wrap"><h2>Học sinh đi muộn</h2>
            <table class="tbl"><thead><tr><th>Ngày</th><th>Mã HS</th><th>Họ tên</th><th>Buổi / tiết</th></tr></thead>
              <tbody>@for (l of late(); track l.id) { <tr><td>{{ l.attendanceDate }}</td><td>{{ l.personCode }}</td><td>{{ l.personName }}</td><td>{{ label[l.session] }} - {{ l.period }}</td></tr> }
                @empty { <tr><td colspan="4" class="empty">Không có học sinh đi muộn</td></tr> }</tbody></table></div>
        }
        @case ('violations') {
          <div class="grid g2"><div class="card"><h2>Thống kê theo loại</h2><app-bar-chart [data]="typeBars()" /></div>
            <div class="card table-wrap"><h2>Học sinh vi phạm nhiều nhất</h2>
              <table class="tbl"><thead><tr><th>Học sinh</th><th>Số lần</th></tr></thead>
                <tbody>@for (t of topStudents(); track t.name) { <tr><td>{{ t.name }}</td><td>{{ t.count }}</td></tr> } @empty { <tr><td colspan="2" class="empty">Chưa có dữ liệu</td></tr> }</tbody></table></div></div>
        }
        @case ('environment') {
          <div class="card table-wrap"><h2>Lịch sử cảnh báo môi trường (7 ngày)</h2>
            <table class="tbl"><thead><tr><th>Thời gian</th><th>Nhiệt độ</th><th>Độ ẩm</th><th>Gas</th><th>Khói</th><th>Lý do</th></tr></thead>
              <tbody>@for (a of env().slice(0, 50); track a.id) { <tr><td>{{ a.recordedAt | date: 'dd/MM HH:mm' }}</td><td>{{ a.temperature }}</td><td>{{ a.humidity }}</td><td>{{ a.gasLevel }}</td><td>{{ a.smokeLevel }}</td><td>{{ a.reasons }}</td></tr> }
                @empty { <tr><td colspan="6" class="empty">Không có cảnh báo</td></tr> }</tbody></table></div>
        }
        @case ('ai') {
          <div class="grid g4"><app-stat-card icon="🤖" label="Cảnh báo AI" [value]="ai().total" /><app-stat-card icon="✅" label="Đã xác minh" [value]="ai().verified" tone="ok" />
            <app-stat-card icon="🚫" label="Bị bác bỏ" [value]="ai().rejected" /><app-stat-card icon="🎯" label="Độ chính xác (đã duyệt)" [value]="ai().precision + '%'" hint="Xác minh / (xác minh + bác bỏ)" /></div>
          <p class="muted mt">Chỉ số dựa trên kết quả giáo viên xác minh; cần đủ số mẫu đã duyệt mới có ý nghĩa thống kê.</p>
        }
      }
    </div>`,
})
export class ReportsComponent {
  private report = inject(ReportService);
  private att = inject(AttendanceService);
  private dev = inject(DeviceService);
  label = SESSION_LABEL;
  tabs: { k: Tab; l: string }[] = [
    { k: 'attendance', l: 'Chuyên cần' }, { k: 'late', l: 'Đi muộn' }, { k: 'violations', l: 'Vi phạm' }, { k: 'environment', l: 'Môi trường' }, { k: 'ai', l: 'Hiệu quả AI' },
  ];
  tab = signal<Tab>('attendance');
  from = toDateStr(addDays(new Date(), -6));
  to = toDateStr();

  trend = signal<AttendanceTrend[]>([]);
  late = signal<AttendanceLog[]>([]);
  vio = signal<Violation[]>([]);
  env = signal<(SensorLog & { reasons: string })[]>([]);

  trendBars = computed(() => this.trend().map((t) => ({ label: t.date.slice(5), value: t.rate })));
  typeBars = computed(() => this.report.byType(this.vio()).map((x) => ({ label: x.name, value: x.count })));
  ai = computed<AiQuality>(() => this.report.aiQuality(this.vio()));
  topStudents = computed(() => {
    const m = new Map<string, number>();
    this.vio().filter((v) => v.personName).forEach((v) => m.set(v.personName!, (m.get(v.personName!) ?? 0) + 1));
    return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  });

  constructor() { this.load(); }

  load(): void {
    const days = Math.max(1, Math.round((+new Date(this.to) - +new Date(this.from)) / 864e5) + 1);
    this.att.trend(days).subscribe((t) => this.trend.set(t));
    this.report.late().subscribe((l) => this.late.set(l.filter((x) => x.attendanceDate >= this.from && x.attendanceDate <= this.to)));
    this.report.violations(this.from, this.to).subscribe((v) => this.vio.set(v));
    this.dev.list().subscribe((m) => this.report.envAlerts(m.map((x) => x.id)).subscribe((e) => this.env.set(e)));
  }

  export(): void {
    switch (this.tab()) {
      case 'attendance': exportCsv('chuyen-can', ['Ngày', 'Tỷ lệ (%)'], this.trend().map((t) => [t.date, t.rate])); break;
      case 'late': exportCsv('di-muon', ['Ngày', 'Mã HS', 'Họ tên', 'Buổi', 'Tiết'], this.late().map((l) => [l.attendanceDate, l.personCode, l.personName, SESSION_LABEL[l.session], l.period])); break;
      case 'violations': exportCsv('vi-pham', ['Loại', 'Số lượng'], this.typeBars().map((b) => [b.label, b.value])); break;
      case 'environment': exportCsv('moi-truong', ['Thời gian', 'Nhiệt độ', 'Độ ẩm', 'Gas', 'Khói', 'Lý do'], this.env().map((e) => [e.recordedAt, e.temperature, e.humidity, e.gasLevel, e.smokeLevel, e.reasons])); break;
      case 'ai': { const a = this.ai(); exportCsv('hieu-qua-ai', ['Tổng', 'Xác minh', 'Bác bỏ', 'Chờ duyệt', 'Chính xác (%)'], [[a.total, a.verified, a.rejected, a.pending, a.precision]]); }
    }
  }
}
