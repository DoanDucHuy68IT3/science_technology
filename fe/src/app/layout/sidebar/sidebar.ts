import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

interface NavItem { path: string; icon: string; label: string }
interface NavGroup { title?: string; items: NavItem[] }

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sb">
      <div class="brand"><span class="logo">🎓</span><div><b>NỀ NẾP AI</b><small>Quản lý lớp học</small></div></div>
      <nav>
        @for (g of groups; track $index) {
          @if (g.title) { <div class="gt">{{ g.title }}</div> }
          @for (i of g.items; track i.path) {
            <a [routerLink]="i.path" routerLinkActive="active"><span>{{ i.icon }}</span>{{ i.label }}</a>
          }
        }
      </nav>
      <button class="out" (click)="auth.logout()">🚪 Đăng xuất</button>
    </aside>`,
    styles: `
    .sb { width: 250px; height: 100vh; position: sticky; top: 0; display: flex; flex-direction: column; background: linear-gradient(180deg, #f3eefe, #e9e0fb); color: var(--p-900); padding: 18px 12px; border-right: 1px solid var(--border); }
    .brand { display: flex; gap: 10px; align-items: center; padding: 6px 10px 18px; border-bottom: 1px solid rgba(132,112,214,.18); margin-bottom: 8px;
      .logo { font-size: 28px; } b { display: block; color: var(--p-700); letter-spacing: .04em; } small { color: var(--muted); } }
    nav { flex: 1; overflow-y: auto; }
    .gt { font-size: 11px; letter-spacing: .1em; color: var(--muted); padding: 14px 12px 4px; font-weight: 700; }
    a { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; color: inherit; text-decoration: none; margin: 2px 0;
      &:hover { background: rgba(255,255,255,.6); } &.active { background: #fff; color: var(--p-700); font-weight: 600; box-shadow: var(--shadow); } }
    .out { background: rgba(255,255,255,.6); color: var(--p-900); border: 0; border-radius: 10px; padding: 10px 12px; cursor: pointer; text-align: left; font: inherit; &:hover { background: #fff; } }
    @media (max-width: 900px) { .sb { width: 68px; .brand div, .gt { display: none; } a { font-size: 0; span { font-size: 18px; } } .out { font-size: 0; &::first-letter { font-size: 18px; } } } }`,
})
export class SidebarComponent {
  auth = inject(AuthService);
  groups: NavGroup[] = [
    { items: [{ path: '/overview', icon: '📊', label: 'Overview' }] },
    { title: 'GIÁM SÁT', items: [
      { path: '/camera-ai', icon: '📹', label: 'Camera AI' },
      { path: '/attendance', icon: '👥', label: 'Điểm danh' },
      { path: '/violations', icon: '⚠️', label: 'Vi phạm' },
    ] },
    { title: 'QUẢN LÝ', items: [
      { path: '/students', icon: '🎓', label: 'Học sinh' },
      { path: '/devices', icon: '🌡️', label: 'Thiết bị & Cảm biến' },
      { path: '/schedules', icon: '🗓️', label: 'Lịch giám sát' },
    ] },
    { title: 'THỐNG KÊ', items: [{ path: '/reports', icon: '📈', label: 'Báo cáo' }] },
    { title: 'HỆ THỐNG', items: [{ path: '/settings', icon: '⚙️', label: 'Cài đặt' }] },
  ];
}
