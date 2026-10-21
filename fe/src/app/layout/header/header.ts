import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { TimeAgoPipe } from '../../shared';

@Component({
  selector: 'app-header',
  imports: [FormsModule, DatePipe, TimeAgoPipe],
  template: `
    <header class="hd">
      <div class="search">🔍 <input [(ngModel)]="q" (keyup.enter)="search()" placeholder="Tìm học sinh, mã học sinh, sự kiện vi phạm..." /></div>
      <div class="spacer"></div>
      <span class="date">{{ now | date: 'EEEE, dd/MM/yyyy' }}</span>
      <div class="bell">
        <button class="ib" (click)="open.set(!open()); rt.markAllRead()" aria-label="Thông báo">🔔 @if (rt.unread() > 0) { <i>{{ rt.unread() }}</i> }</button>
        @if (open()) {
          <div class="dd">
            <h3>Thông báo</h3>
            @for (n of rt.notifications(); track n.id) {
              <div class="it"><span>{{ n.kind === 'VIOLATION' ? '⚠️' : n.kind === 'ENVIRONMENT' ? '🌡️' : '📡' }}</span><div>{{ n.title }}<small>{{ n.time | timeAgo }}</small></div></div>
            } @empty { <div class="empty">Chưa có thông báo mới</div> }
          </div>
        }
      </div>
      <div class="me"><span class="av">{{ initials() }}</span><span>Xin chào, <b>{{ auth.user()?.fullName ?? 'Giáo viên' }}</b>!</span></div>
    </header>`,
  styles: `
    .hd { display: flex; align-items: center; gap: 16px; padding: 12px 24px; background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; }
    .search { display: flex; align-items: center; gap: 8px; background: var(--p-50); border-radius: 12px; padding: 4px 12px; width: min(420px, 100%); input { border: 0; background: none; flex: 1; outline: none; padding: 6px 0; } }
    .date { color: var(--muted); text-transform: capitalize; } .spacer { flex: 1; }
    .bell { position: relative; } .ib { background: var(--p-50); border: 0; border-radius: 12px; padding: 8px 12px; cursor: pointer; position: relative; font-size: 16px; }
    .ib i { position: absolute; top: -4px; right: -4px; background: var(--danger); color: #fff; border-radius: 999px; font: 700 11px sans-serif; padding: 2px 6px; }
    .dd { position: absolute; right: 0; top: 46px; width: 340px; max-height: 420px; overflow: auto; background: #fff; border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 12px 40px rgba(60,20,120,.2); padding: 14px; }
    .it { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); small { display: block; color: var(--muted); } }
    .me { display: flex; align-items: center; gap: 10px; } .av { width: 36px; height: 36px; border-radius: 50%; background: var(--p-600); color: #fff; display: grid; place-items: center; font-weight: 700; }
    @media (max-width: 760px) { .date, .me span:last-child { display: none; } }`,
})
export class HeaderComponent {
  auth = inject(AuthService);
  rt = inject(RealtimeService);
  private router = inject(Router);
  q = '';
  now = new Date();
  open = signal(false);

  initials(): string {
    const n = (this.auth.user()?.fullName ?? 'GV').trim().split(/\s+/);
    return (n.at(-1)?.[0] ?? 'G').toUpperCase();
  }

  search(): void {
    const q = this.q.trim();
    if (q) this.router.navigate(['/violations'], { queryParams: { q } });
  }
}
