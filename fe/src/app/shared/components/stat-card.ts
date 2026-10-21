import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <div class="sc" [class]="tone()">
      <div class="ic">{{ icon() }}</div>
      <div>
        <div class="lb">{{ label() }}</div>
        <div class="vl">{{ value() }}</div>
        @if (hint()) { <div class="ht">{{ hint() }}</div> }
      </div>
    </div>`,
  styles: `
    .sc { display: flex; gap: 14px; align-items: center; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; box-shadow: var(--shadow); }
    .ic { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; background: var(--p-100); }
    .warn .ic { background: #fef3c7; } .danger .ic { background: #fee2e2; } .ok .ic { background: #dcfce7; }
    .lb { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; }
    .vl { font-size: 28px; font-weight: 700; line-height: 1.1; } .ht { font-size: 12px; color: var(--muted); }`,
})
export class StatCardComponent {
  icon = input('📊');
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input('');
  tone = input<'' | 'ok' | 'warn' | 'danger'>('');
}
