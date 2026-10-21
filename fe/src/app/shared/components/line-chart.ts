import { Component, computed, input } from '@angular/core';

export interface Series { name: string; color: string; values: number[] }

/** Biểu đồ đường SVG thuần (không phụ thuộc thư viện), hỗ trợ đường ngưỡng. */
@Component({
  selector: 'app-line-chart',
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="ch" preserveAspectRatio="none">
      @for (t of yTicks(); track t.y) {
        <line [attr.x1]="L" [attr.x2]="W - 8" [attr.y1]="t.y" [attr.y2]="t.y" stroke="#eee" />
        <text [attr.x]="L - 6" [attr.y]="t.y + 4" text-anchor="end" class="tx">{{ t.label }}</text>
      }
      @for (x of xTicks(); track x.x) { <text [attr.x]="x.x" [attr.y]="H - 6" text-anchor="middle" class="tx">{{ x.label }}</text> }
      @for (th of thresholdLines(); track th.y) {
        <line [attr.x1]="L" [attr.x2]="W - 8" [attr.y1]="th.y" [attr.y2]="th.y" stroke="#dc2626" stroke-dasharray="5 4" />
        <text [attr.x]="W - 10" [attr.y]="th.y - 3" text-anchor="end" class="tx red">{{ th.label }}</text>
      }
      @for (p of paths(); track p.name) { <path [attr.d]="p.d" fill="none" [attr.stroke]="p.color" stroke-width="2" stroke-linejoin="round" /> }
    </svg>
    <div class="lg">@for (s of series(); track s.name) { <span><i [style.background]="s.color"></i>{{ s.name }}</span> }</div>`,
  styles: `
    .ch { width: 100%; height: 220px; } .tx { font-size: 10px; fill: #7a7390; } .tx.red { fill: #dc2626; }
    .lg { display: flex; gap: 14px; font-size: 12px; color: var(--muted); i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; } }`,
})
export class LineChartComponent {
  readonly W = 640; readonly H = 220; readonly L = 40; private readonly T = 10; private readonly B = 24;
  labels = input<string[]>([]);
  series = input<Series[]>([]);
  /** Các mốc ngưỡng vẽ đường đứt đoạn đỏ */
  thresholds = input<{ value: number; label: string }[]>([]);

  private range = computed(() => {
    const vals = [...this.series().flatMap((s) => s.values), ...this.thresholds().map((t) => t.value)];
    if (!vals.length) return { min: 0, max: 1 };
    const min = Math.min(...vals), max = Math.max(...vals);
    const pad = (max - min || 1) * 0.1;
    return { min: Math.floor(min - pad), max: Math.ceil(max + pad) };
  });
  private y = (v: number) => {
    const { min, max } = this.range();
    return this.T + (1 - (v - min) / (max - min || 1)) * (this.H - this.T - this.B);
  };
  paths = computed(() =>
    this.series().map((s) => {
      const n = s.values.length;
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${(this.L + (i / Math.max(n - 1, 1)) * (this.W - this.L - 8)).toFixed(1)},${this.y(v).toFixed(1)}`).join('');
      return { name: s.name, color: s.color, d };
    }),
  );
  yTicks = computed(() => {
    const { min, max } = this.range();
    return Array.from({ length: 5 }, (_, i) => { const v = min + ((max - min) * i) / 4; return { y: this.y(v), label: v.toFixed(0) }; });
  });
  xTicks = computed(() => {
    const l = this.labels(); const n = l.length; if (!n) return [];
    const step = Math.max(Math.floor(n / 6), 1);
    return l.map((label, i) => ({ label, x: this.L + (i / Math.max(n - 1, 1)) * (this.W - this.L - 8), i })).filter((t) => t.i % step === 0);
  });
  thresholdLines = computed(() => this.thresholds().map((t) => ({ y: this.y(t.value), label: t.label })));
}
