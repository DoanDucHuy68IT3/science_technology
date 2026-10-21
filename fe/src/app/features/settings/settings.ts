import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppSettings, SESSION_LABEL, ViolationType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { ViolationService } from '../../core/services/violation.service';

type Tab = 'account' | 'class' | 'thresholds' | 'telegram' | 'criteria';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-head"><div><h1>⚙️ Cài đặt</h1><p class="sub">Cấu hình lớp học, ngưỡng cảnh báo, thông báo</p></div>
        <div class="row">@if (msg()) { <span class="badge ok">{{ msg() }}</span> }<button class="btn primary" [disabled]="!s() || saving()" (click)="save()">{{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}</button></div></div>

      <div class="tabs">@for (t of tabs; track t.k) { <button [class.active]="tab() === t.k" (click)="tab.set(t.k)">{{ t.l }}</button> }</div>

      @if (s(); as c) {
        @switch (tab()) {
          @case ('account') {
            <div class="card"><div class="form-grid">
              <label class="f">Họ và tên<input [value]="auth.user()?.fullName" disabled /></label><label class="f">Tên đăng nhập<input [value]="auth.user()?.username" disabled /></label>
              <label class="f">Email<input [value]="auth.user()?.email" disabled /></label><label class="f">Số điện thoại<input [value]="auth.user()?.phone ?? ''" disabled /></label></div>
              <p class="muted">Thông tin tài khoản do quản trị viên cấp; đổi mật khẩu thực hiện qua API <code>/auth/change-password</code> khi backend sẵn sàng.</p></div>
          }
          @case ('class') {
            <div class="card"><label class="f" style="max-width:240px">Lớp phụ trách<input [(ngModel)]="c.className" /></label>
              <h2 class="mt">Giờ bắt đầu từng tiết</h2>
              <table class="tbl"><thead><tr><th>Buổi</th><th>Tiết</th><th>Giờ bắt đầu</th><th>Tính muộn sau (phút)</th></tr></thead>
                <tbody>@for (p of c.timetable; track $index) { <tr><td>{{ label[p.session] }}</td><td>{{ p.period }}</td><td><input type="time" [(ngModel)]="p.startTime" /></td><td><input type="number" min="0" style="width:90px" [(ngModel)]="p.lateAfterMinutes" /></td></tr> }</tbody></table></div>
          }
          @case ('thresholds') {
            <div class="card"><div class="form-grid">
              <label class="f">Nhiệt độ cảnh báo (°C)<input type="number" [(ngModel)]="c.thresholds.tempWarning" /></label><label class="f">Nhiệt độ nguy hiểm (°C)<input type="number" [(ngModel)]="c.thresholds.tempDanger" /></label>
              <label class="f">Độ ẩm cao (%)<input type="number" [(ngModel)]="c.thresholds.humidityHigh" /></label><span></span>
              <label class="f">Khí gas — cảnh báo<input type="number" [(ngModel)]="c.thresholds.gasWarning" /></label><label class="f">Khí gas — nguy hiểm<input type="number" [(ngModel)]="c.thresholds.gasDanger" /></label>
              <label class="f">Khói — cảnh báo<input type="number" [(ngModel)]="c.thresholds.smokeWarning" /></label><label class="f">Khói — nguy hiểm<input type="number" [(ngModel)]="c.thresholds.smokeDanger" /></label></div>
              <p class="muted">Giá trị MQ-2 là giá trị cảm biến, chưa quy đổi ppm. Cần hiệu chuẩn thực tế trước khi dùng để kết luận mức an toàn.</p></div>
          }
          @case ('telegram') {
            <div class="card"><label class="row"><input type="checkbox" [(ngModel)]="c.telegram.enabled" /> Bật thông báo Telegram</label>
              <div class="form-grid mt"><label class="f">Bot token<input type="password" [(ngModel)]="c.telegram.tokenTele" /></label><label class="f">Chat ID<input [(ngModel)]="c.telegram.idChatTele" /></label></div>
              <button class="btn mt" (click)="test()" [disabled]="!c.telegram.tokenTele || !c.telegram.idChatTele">Gửi tin thử</button> @if (testMsg()) { <span class="muted"> {{ testMsg() }}</span> }</div>
          }
          @case ('criteria') {
            <div class="card"><p class="muted">Bật/tắt tiêu chí tác phong mà AI cần giám sát.</p>
              @for (t of types(); track t.id) { <label class="row" style="padding:6px 0"><input type="checkbox" [ngModel]="c.criteria[t.code] !== false" (ngModelChange)="c.criteria[t.code] = $event" /> <b>{{ t.name }}</b> <span class="muted">{{ t.description }}</span></label> }</div>
          }
        }
      } @else { <div class="empty">Đang tải cấu hình...</div> }
    </div>`,
})
export class SettingsComponent {
  private api = inject(SettingsService);
  private vio = inject(ViolationService);
  auth = inject(AuthService);
  label = SESSION_LABEL;
  tabs: { k: Tab; l: string }[] = [
    { k: 'account', l: 'Tài khoản' }, { k: 'class', l: 'Lớp & thời khóa biểu' }, { k: 'thresholds', l: 'Ngưỡng môi trường' }, { k: 'telegram', l: 'Telegram' }, { k: 'criteria', l: 'Tiêu chí tác phong' },
  ];
  tab = signal<Tab>('class');
  s = signal<AppSettings | null>(null);
  types = signal<ViolationType[]>([]);
  saving = signal(false);
  msg = signal('');
  testMsg = signal('');

  constructor() {
    this.api.load().subscribe((c) => this.s.set(c));
    this.vio.types().subscribe((t) => this.types.set(t));
  }

  save(): void {
    const c = this.s();
    if (!c) return;
    this.saving.set(true);
    this.api.save(c).subscribe({
      next: () => { this.saving.set(false); this.msg.set('Đã lưu'); setTimeout(() => this.msg.set(''), 2500); },
      error: () => { this.saving.set(false); this.msg.set('Lưu thất bại'); },
    });
  }

  test(): void {
    this.api.testTelegram().subscribe({ next: (r) => this.testMsg.set(r.ok ? 'Đã gửi tin thử' : 'Gửi thất bại'), error: () => this.testMsg.set('Gửi thất bại') });
  }
}
