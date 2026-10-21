import { Component, computed, input } from '@angular/core';

/** Biểu đồ cột ngang đơn giản (cơ cấu vi phạm theo loại, số vi phạm theo ngày). */
@Component({
  selector: 'app-bar-chart',
  template: `
    @for (b of bars(); track b.label) {
      <div class="r"><span class="n" [title]="b.label">{{ b.label }}</span>
        <div class="t"><div class="f" [style.width.%]="b.pct"></div></div><b>{{ b.value }}</b></div>
    } @empty { <div class="empty">Chưa có dữ liệu</div> }`,
  styles: `
    .r { display: grid; grid-template-columns: 150px 1fr 36px; gap: 10px; align-items: center; margin: 8px 0; }
    .n { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .t { background: var(--p-50); border-radius: 8px; height: 14px; overflow: hidden; }
    .f { background: linear-gradient(90deg, var(--p-400), var(--p-600)); height: 100%; border-radius: 8px; } b { text-align: right; }`,
})
export class BarChartComponent {
  data = input<{ label: string; value: number }[]>([]);
  bars = computed(() => {
    const max = Math.max(...this.data().map((d) => d.value), 1);
    return this.data().map((d) => ({ ...d, pct: (d.value / max) * 100 }));
  });
}
