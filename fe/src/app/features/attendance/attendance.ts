import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceLog, AttendanceOverview, AttendanceTrend, PeriodSummary, SESSION_LABEL, SessionName, Student } from '../../core/models';
import { AttendanceService } from '../../core/services/attendance.service';
import { BarChartComponent, StatCardComponent, StatusBadgeComponent, exportCsv, toDateStr } from '../../shared';

@Component({
  selector: 'app-attendance',
  imports: [FormsModule, StatCardComponent, StatusBadgeComponent, BarChartComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>👥 Điểm danh</h1><p class="sub">Theo dõi chuyên cần theo buổi và tiết học</p></div>
        <button class="btn" (click)="export()">⬇ Xuất CSV</button></div>

      <div class="card row">
        <label class="f">Ngày<input type="date" [(ngModel)]="date" (ngModelChange)="refresh()" /></label>
        <label class="f">Buổi<select [(ngModel)]="session" (ngModelChange)="refresh()"><option [ngValue]="undefined">Tất cả</option>@for (s of sessions; track s) { <option [ngValue]="s">{{ label[s] }}</option> }</select></label>
        <label class="f">Tiết<select [(ngModel)]="period" (ngModelChange)="refresh()"><option [ngValue]="undefined">Tất cả</option>@for (p of [1,2,3,4,5]; track p) { <option [ngValue]="p">Tiết {{ p }}</option> }</select></label>
      </div>

      <div class="grid g4 mt">
        <app-stat-card icon="🎓" label="Tổng số học sinh" [value]="ov().total" />
        <app-stat-card icon="✅" label="Đã điểm danh" [value]="ov().present" tone="ok" />
        <app-stat-card icon="❌" label="Chưa điểm danh" [value]="ov().absent" tone="danger" />
        <app-stat-card icon="⏰" label="Đi muộn" [value]="ov().late" tone="warn" />
      </div>

      <div class="grid g2 mt">
        <div class="card table-wrap"><h2>Điểm danh theo tiết</h2>
          <table class="tbl"><thead><tr><th>Buổi</th><th>Tiết</th><th>Đã điểm danh</th><th>Tổng số</th><th>Trạng thái</th></tr></thead>
            <tbody>@for (p of periods(); track p.session + p.period) {
              <tr class="click" (click)="pick(p)"><td>{{ label[p.session] }}</td><td>{{ p.period }}</td><td>{{ p.present }}</td><td>{{ p.total }}</td>
                <td>@if (p.present >= p.total) { <span class="badge ok">Hoàn tất</span> } @else { <span class="badge warn">Thiếu {{ p.total - p.present }}</span> }</td></tr>
            } @empty { <tr><td colspan="5" class="empty">Chưa có dữ liệu ngày này</td></tr> }</tbody></table></div>
        <div class="card"><h2>Chưa điểm danh @if (period && session) { — {{ label[session] }}, tiết {{ period }} }</h2>
          @if (!session || !period) { <p class="empty">Chọn buổi và tiết (hoặc bấm vào một dòng bên trái) để xem danh sách.</p> }
          @else { <ul class="ab">@for (s of absent(); track s.id) { <li>{{ s.personCode }} — {{ s.fullName }}</li> } @empty { <li class="muted">Tất cả đã có mặt 🎉</li> }</ul> }</div>
      </div>

      <div class="grid g2 mt">
        <div class="card"><h2>Tỷ lệ chuyên cần 7 ngày</h2>
          <app-bar-chart [data]="trendBars()" /></div>
        <div class="card table-wrap"><h2>Lịch sử điểm danh</h2>
          <div class="row"><select [(ngModel)]="histPerson" (ngModelChange)="loadHistory()"><option [ngValue]="undefined">Tất cả học sinh</option>@for (s of roster(); track s.id) { <option [ngValue]="s.id">{{ s.fullName }}</option> }</select></div>
          <table class="tbl"><thead><tr><th>Ngày</th><th>Học sinh</th><th>Tiết</th><th>Trạng thái</th></tr></thead>
            <tbody>@for (h of histShown().slice(0, 12); track h.id) { <tr><td>{{ h.attendanceDate }}</td><td>{{ h.personName }}</td><td>{{ label[h.session] }} - {{ h.period }}</td><td><app-status-badge [status]="h.status" /></td></tr> }</tbody></table></div>
      </div>
    </div>`,
  styles: `.ab { list-style: none; padding: 0; margin: 0; li { padding: 8px 0; border-bottom: 1px solid var(--border); } }`,
})
export class AttendanceComponent {
  private api = inject(AttendanceService);
  /** ?q= từ trang Học sinh / ô tìm kiếm */
  q = input<string>();
  label = SESSION_LABEL;
  sessions: SessionName[] = ['MORNING', 'AFTERNOON', 'EVENING'];
  date = toDateStr();
  session?: SessionName;
  period?: number;
  histPerson?: number;

  ov = signal<AttendanceOverview>({ total: 0, present: 0, absent: 0, late: 0 });
  periods = signal<PeriodSummary[]>([]);
  absent = signal<Student[]>([]);
  trend = signal<AttendanceTrend[]>([]);
  history = signal<AttendanceLog[]>([]);
  roster = signal<Student[]>([]);
  histShown = computed(() => { const k = (this.q() ?? '').toLowerCase(); return k ? this.history().filter((h) => h.personName.toLowerCase().includes(k) || h.personCode.toLowerCase().includes(k)) : this.history(); });
  trendBars = computed(() => this.trend().map((t) => ({ label: t.date.slice(5), value: t.rate })));

  constructor() {
    this.refresh();
    this.api.trend(7).subscribe((t) => this.trend.set(t));
    this.loadHistory();
  }

  refresh(): void {
    this.api.overview(this.date, this.session, this.period).subscribe((o) => this.ov.set(o));
    this.api.periods(this.date).subscribe((p) => this.periods.set(p));
    this.loadAbsent();
  }

  loadAbsent(): void {
    if (this.session && this.period) this.api.absentees(this.date, this.session, this.period).subscribe((a) => this.absent.set(a));
  }

  pick(p: PeriodSummary): void {
    this.session = p.session;
    this.period = p.period;
    this.refresh();
  }

  loadHistory(): void {
    this.api.history(this.histPerson).subscribe((h) => {
      this.history.set(h);
      if (!this.roster().length) {
        const m = new Map(h.map((x) => [x.personId, { id: x.personId, fullName: x.personName } as Student]));
        this.roster.set([...m.values()]);
      }
    });
  }

  export(): void {
    this.api.history(this.histPerson).subscribe((h) =>
      exportCsv(`diem-danh-${this.date}`, ['Ngày', 'Mã HS', 'Họ tên', 'Buổi', 'Tiết', 'Trạng thái', 'Giờ ghi nhận'], h.map((x) => [x.attendanceDate, x.personCode, x.personName, SESSION_LABEL[x.session], x.period, x.status, x.checkedAt])),
    );
  }
}
