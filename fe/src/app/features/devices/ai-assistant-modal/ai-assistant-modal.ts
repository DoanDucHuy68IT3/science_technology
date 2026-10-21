import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../../core/services/device.service';
import { ModalComponent } from '../../../shared';

interface Msg { role: 'user' | 'ai'; text: string }

/** Trợ lý AI về môi trường học đường (server dựng ngữ cảnh từ sensor_logs + ngưỡng). */
@Component({
  selector: 'app-ai-assistant-modal',
  imports: [FormsModule, ModalComponent],
  template: `
    <app-modal title="🤖 Trợ lý AI môi trường" [width]="620" (closed)="closed.emit()">
      <div class="chat">
        @for (m of msgs(); track $index) { <div class="m" [class.u]="m.role === 'user'">{{ m.text }}</div> }
        @if (busy()) { <div class="m">Đang phân tích dữ liệu cảm biến...</div> }
      </div>
      <div class="chips">@for (s of suggestions; track s) { <button class="btn sm" (click)="ask(s)">{{ s }}</button> }</div>
      <div class="row"><input class="grow" [(ngModel)]="text" (keyup.enter)="ask(text)" placeholder="Hỏi về nhiệt độ, độ ẩm, khí gas..." /><button class="btn primary" [disabled]="busy() || !text.trim()" (click)="ask(text)">Gửi</button></div>
      <small class="muted">AI dựa trên dữ liệu cảm biến và ngưỡng cấu hình. Với cảnh báo gas/khói, hãy kiểm tra trực tiếp theo quy trình an toàn — AI không thay thế việc đó.</small>
    </app-modal>`,
  styles: `
    .chat { min-height: 180px; max-height: 320px; overflow: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .m { background: var(--p-50); padding: 10px 14px; border-radius: 12px; max-width: 85%; align-self: flex-start; white-space: pre-wrap; } .m.u { background: var(--p-600); color: #fff; align-self: flex-end; }
    .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; } .grow { flex: 1; } small { display: block; margin-top: 10px; }`,
})
export class AiAssistantModalComponent {
  private api = inject(DeviceService);
  mcuId = input<number>();
  closed = output<void>();
  text = '';
  busy = signal(false);
  msgs = signal<Msg[]>([{ role: 'ai', text: 'Xin chào! Tôi có thể giúp bạn đọc dữ liệu môi trường lớp học.' }]);
  suggestions = ['Nhiệt độ lớp học hiện tại có cao không?', 'Độ ẩm hôm nay thay đổi như thế nào?', 'Mức khí gas vừa tăng, tôi nên kiểm tra những gì?'];

  ask(q: string): void {
    q = q.trim();
    if (!q || this.busy()) return;
    this.msgs.update((m) => [...m, { role: 'user', text: q }]);
    this.text = '';
    this.busy.set(true);
    this.api.askAssistant(q, this.mcuId()).subscribe({
      next: (r) => { this.msgs.update((m) => [...m, { role: 'ai', text: r.answer }]); this.busy.set(false); },
      error: () => { this.msgs.update((m) => [...m, { role: 'ai', text: 'Không thể kết nối trợ lý AI. Vui lòng thử lại.' }]); this.busy.set(false); },
    });
  }
}
