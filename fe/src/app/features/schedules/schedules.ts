import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CameraDevice, CameraSchedule } from '../../core/models';
import { CameraService } from '../../core/services/camera.service';
import { ModalComponent, WEEKDAYS, addDays, pad, toDateStr, toMinutes } from '../../shared';

type View = 'day' | 'week' | 'month';
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 7]; // 1 = Thứ 2 ... 7 = Chủ nhật
const dowOf = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

/** Lịch giám sát tự dựng (ngày / tuần / tháng) từ bảng camera_schedules. */
@Component({
  selector: 'app-schedules',
  imports: [FormsModule, ModalComponent],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>🗓️ Lịch giám sát</h1><p class="sub">Khung giờ hoạt động của từng camera</p></div><button class="btn primary" (click)="edit(null)">+ Thêm lịch</button></div>

      <div class="card">
        <div class="row">
          <button class="btn" (click)="shift(-1)">‹</button><button class="btn" (click)="cursor.set(today)">Hôm nay</button><button class="btn" (click)="shift(1)">›</button>
          <b class="spacer">{{ title() }}</b>
          <div class="tabs" style="margin:0;border:0">
            @for (v of views; track v.k) { <button [class.active]="view() === v.k" (click)="view.set(v.k)">{{ v.l }}</button> }
          </div>
        </div>

        @if (view() === 'month') {
          <div class="mgrid">
            @for (h of heads; track h) { <div class="mh">{{ h }}</div> }
            @for (c of monthCells(); track c.key) {
              <div class="mc" [class.out]="!c.inMonth" [class.today]="c.key === todayStr"><span class="dn">{{ c.day }}</span>
                @for (e of c.events.slice(0, 3); track e.id) { <div class="ev" [class.off]="!e.isActive">{{ camName(e.cameraId) }} {{ e.startTime }}</div> }
                @if (c.events.length > 3) { <small class="muted">+{{ c.events.length - 3 }}</small> }</div>
            }
          </div>
        } @else {
          <div class="tgrid" [style.grid-template-columns]="'56px repeat(' + days().length + ', 1fr)'">
            <div></div>@for (d of days(); track d.key) { <div class="mh" [class.today]="d.key === todayStr">{{ d.label }}</div> }
            <div class="hours">@for (h of hours; track h) { <div>{{ h }}:00</div> }</div>
            @for (d of days(); track d.key) {
              <div class="col">
                @for (e of d.events; track e.id) {
                  <div class="blk" [class.off]="!e.isActive" [style.top.%]="pct(e.startTime)" [style.height.%]="span(e)" (click)="edit(e)" [title]="e.scheduleName">
                    <b>{{ camName(e.cameraId) }}</b> {{ e.startTime }}–{{ e.endTime }}</div>
                }
              </div>
            }
          </div>
        }
      </div>

      <div class="card mt table-wrap"><h2>Danh sách lịch</h2>
        <table class="tbl"><thead><tr><th>Camera</th><th>Tên lịch</th><th>Thời gian</th><th>Thứ trong tuần</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>@for (s of rows(); track s.id) { <tr><td>{{ camName(s.cameraId) }}</td><td>{{ s.scheduleName }}</td>
            <td>{{ s.startTime }}–{{ s.endTime }} @if (overnight(s)) { <span class="badge warn">qua nửa đêm</span> }</td><td>{{ dowText(s.daysOfWeek) }}</td>
            <td><span class="badge" [class.ok]="s.isActive" [class.gray]="!s.isActive">{{ s.isActive ? 'Hoạt động' : 'Tạm dừng' }}</span></td>
            <td class="row"><button class="btn sm" (click)="edit(s)">Sửa</button><button class="btn sm danger" (click)="remove(s)">Xóa</button></td></tr>
          } @empty { <tr><td colspan="6" class="empty">Chưa có lịch</td></tr> }</tbody></table></div>
    </div>

    @if (form(); as f) {
      <app-modal [title]="f.id ? 'Sửa lịch' : 'Thêm lịch'" (closed)="form.set(null)">
        <div class="form-grid">
          <label class="f">Camera<select [(ngModel)]="f.cameraId">@for (c of cameras(); track c.id) { <option [ngValue]="c.id">{{ c.cameraName }}</option> }</select></label>
          <label class="f">Tên lịch<input [(ngModel)]="f.scheduleName" /></label>
          <label class="f">Bắt đầu<input type="time" [(ngModel)]="f.startTime" /></label>
          <label class="f">Kết thúc<input type="time" [(ngModel)]="f.endTime" /></label>
          <div class="f full">Các ngày trong tuần
            <div class="row">@for (d of dowOrder; track d) { <label><input type="checkbox" [checked]="hasDay(f, d)" (change)="toggleDay(f, d)" /> {{ dowLabel(d) }}</label> }</div></div>
          <label class="f"><span>Trạng thái</span><select [(ngModel)]="f.isActive"><option [ngValue]="true">Hoạt động</option><option [ngValue]="false">Tạm dừng</option></select></label>
        </div>
        @if (f.startTime && f.endTime && f.endTime <= f.startTime) { <p class="muted">⚠ Giờ kết thúc ≤ giờ bắt đầu: lịch được hiểu là qua nửa đêm (kết thúc ngày hôm sau).</p> }
        <div footer><button class="btn" (click)="form.set(null)">Hủy</button><button class="btn primary" [disabled]="!f.cameraId || !f.scheduleName || !f.startTime || !f.endTime || !f.daysOfWeek" (click)="save(f)">Lưu</button></div>
      </app-modal>
    }`,
  styles: `
    .mgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); margin-top: 12px; border: 1px solid var(--border); }
    .mh { background: var(--p-50); text-align: center; padding: 8px 4px; font-weight: 600; font-size: 12px; &.today { background: var(--p-200); } }
    .mc { background: #fff; min-height: 92px; padding: 4px 6px; &.out { background: #faf8ff; color: #bbb; } &.today { outline: 2px solid var(--p-500); outline-offset: -2px; } }
    .dn { font-size: 12px; font-weight: 600; } .ev { background: var(--p-100); color: var(--p-700); border-radius: 4px; padding: 1px 5px; font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; &.off { background: #eee; color: #888; } }
    .tgrid { display: grid; gap: 1px; background: var(--border); margin-top: 12px; border: 1px solid var(--border); }
    .hours { background: #fff; height: 600px; display: flex; flex-direction: column; font-size: 10px; color: var(--muted); div { flex: 1; border-top: 1px solid var(--border); padding: 2px 4px; } }
    .col { background: #fff; height: 600px; position: relative; }
    .blk { position: absolute; left: 2px; right: 2px; background: var(--p-500); color: #fff; border-radius: 6px; padding: 3px 6px; font-size: 11px; overflow: hidden; cursor: pointer; opacity: .92; &.off { background: #aaa; } }`,
})
export class SchedulesComponent {
  private api = inject(CameraService);
  views: { k: View; l: string }[] = [{ k: 'day', l: 'Ngày' }, { k: 'week', l: 'Tuần' }, { k: 'month', l: 'Tháng' }];
  heads = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  hours = Array.from({ length: 24 }, (_, i) => pad(i));
  dowOrder = DOW_ORDER;
  today = new Date();
  todayStr = toDateStr();

  view = signal<View>('week');
  cursor = signal(new Date());
  rows = signal<CameraSchedule[]>([]);
  cameras = signal<CameraDevice[]>([]);
  form = signal<Partial<CameraSchedule> | null>(null);

  title = computed(() => {
    const c = this.cursor();
    if (this.view() === 'month') return `Tháng ${c.getMonth() + 1}/${c.getFullYear()}`;
    if (this.view() === 'day') return `${WEEKDAYS[c.getDay()]}, ${pad(c.getDate())}/${pad(c.getMonth() + 1)}/${c.getFullYear()}`;
    const d = this.weekDays();
    return `${pad(d[0].getDate())}/${pad(d[0].getMonth() + 1)} – ${pad(d[6].getDate())}/${pad(d[6].getMonth() + 1)}/${d[6].getFullYear()}`;
  });
  private weekDays = computed(() => { const c = this.cursor(); const mon = addDays(c, 1 - dowOf(c)); return Array.from({ length: 7 }, (_, i) => addDays(mon, i)); });
  days = computed(() => (this.view() === 'day' ? [this.cursor()] : this.weekDays()).map((d) => ({ key: toDateStr(d), label: `${WEEKDAYS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, events: this.eventsOn(d) })));
  monthCells = computed(() => {
    const c = this.cursor(); const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const start = addDays(first, 1 - dowOf(first));
    return Array.from({ length: 42 }, (_, i) => { const d = addDays(start, i); return { key: toDateStr(d), day: d.getDate(), inMonth: d.getMonth() === c.getMonth(), events: this.eventsOn(d) }; });
  });

  constructor() { this.load(); this.api.list().subscribe((c) => this.cameras.set(c)); }

  load(): void { this.api.schedules().subscribe((r) => this.rows.set(r)); }
  shift(n: number): void {
    const c = this.cursor();
    this.cursor.set(this.view() === 'month' ? new Date(c.getFullYear(), c.getMonth() + n, 1) : addDays(c, n * (this.view() === 'week' ? 7 : 1)));
  }

  overnight = (s: Pick<CameraSchedule, 'startTime' | 'endTime'>) => toMinutes(s.endTime) <= toMinutes(s.startTime);
  /** Lịch qua nửa đêm: chặn đầu hiển thị đến 24:00 (phần sau nửa đêm thuộc ngày kế tiếp, chưa tách riêng) */
  private eventsOn(d: Date): CameraSchedule[] { return this.rows().filter((s) => s.daysOfWeek.split(',').map(Number).includes(dowOf(d))); }
  pct = (t: string) => (toMinutes(t) / 1440) * 100;
  span = (s: CameraSchedule) => ((this.overnight(s) ? 1440 - toMinutes(s.startTime) : toMinutes(s.endTime) - toMinutes(s.startTime)) / 1440) * 100;
  camName = (id: number) => this.cameras().find((c) => c.id === id)?.cameraCode ?? `#${id}`;
  dowLabel = (d: number) => (d === 7 ? 'CN' : `T${d + 1}`);
  dowText = (s: string) => s.split(',').map((x) => this.dowLabel(+x)).join(', ');

  edit(s: CameraSchedule | null): void {
    this.form.set(s ? { ...s } : { cameraId: this.cameras()[0]?.id, scheduleName: '', startTime: '06:30', endTime: '11:30', daysOfWeek: '1,2,3,4,5', isActive: true });
  }
  hasDay = (f: Partial<CameraSchedule>, d: number) => (f.daysOfWeek ?? '').split(',').includes(String(d));
  toggleDay(f: Partial<CameraSchedule>, d: number): void {
    const set = new Set((f.daysOfWeek ?? '').split(',').filter(Boolean).map(Number));
    set.has(d) ? set.delete(d) : set.add(d);
    f.daysOfWeek = [...set].sort().join(',');
  }
  save(f: Partial<CameraSchedule>): void { this.api.saveSchedule(f).subscribe(() => { this.form.set(null); this.load(); }); }
  remove(s: CameraSchedule): void { if (confirm(`Xóa lịch "${s.scheduleName}"?`)) this.api.removeSchedule(s.id).subscribe(() => this.load()); }
}
