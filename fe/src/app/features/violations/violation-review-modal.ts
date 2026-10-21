import { DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Violation, ReviewStatus } from '../../core/models';
import { ViolationService } from '../../core/services/violation.service';
import { ConfidencePipe, ModalComponent, StatusBadgeComponent } from '../../shared';

@Component({
  selector: 'app-violation-review-modal',
  imports: [FormsModule, DatePipe, ModalComponent, StatusBadgeComponent, ConfidencePipe],
  template: `
    <app-modal title="Chi tiết sự kiện" (closed)="closed.emit()">
      <div class="img">
        @if (v().imageUrl) {
          <img [src]="getImageUrl(v().imageUrl)" alt="Ảnh minh chứng" />
        } @else {
          📷 Chưa có ảnh minh chứng
        }
      </div>
      <div class="info">
        <div><span>Học sinh</span><b>{{ v().personName ?? 'Chưa nhận diện' }} {{ v().personCode ? '(' + v().personCode + ')' : '' }}</b></div>
        <div><span>Loại vi phạm</span><b>{{ v().violationTypeName }}</b></div>
        <div><span>Camera</span><b>{{ v().cameraName ?? '#' + v().cameraId }}</b></div>
        <div><span>Thời gian</span><b>{{ v().detectedAt | date: 'dd/MM/yyyy HH:mm:ss' }}</b></div>
        <div><span>Độ tin cậy</span><b>{{ v().confidence | confidence }}</b></div>
        <div><span>Trạng thái</span><app-status-badge [status]="v().reviewStatus" /></div>
      </div>
      <p class="note">Đây là kết quả dự đoán của AI, cần giáo viên xem xét trước khi xác nhận.</p>
      <label class="f">Ghi chú<textarea rows="3" [(ngModel)]="note" placeholder="Nhập ghi chú (không bắt buộc)"></textarea></label>
      <div footer>
        <button class="btn" (click)="closed.emit()">Đóng</button>
        <!-- Khớp chính xác với kiểu ReviewRequest trong model của bạn -->
        <button class="btn danger" [disabled]="busy()" (click)="submit('REJECTED')">Bác bỏ (nhận diện sai)</button>
        <button class="btn primary" [disabled]="busy()" (click)="submit('VERIFIED')">Xác minh vi phạm</button>
      </div>
    </app-modal>`,
  styles: `
    .img { background: var(--p-50); border-radius: 12px; min-height: 180px; display: grid; place-items: center; color: var(--muted); margin-bottom: 14px; overflow: hidden; img { width: 100%; max-height: 300px; object-fit: contain; } }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; div { display: flex; flex-direction: column; gap: 2px; } span { font-size: 12px; color: var(--muted); } }
    .note { background: #fffbeb; border-radius: 10px; padding: 8px 12px; font-size: 12px; color: #92400e; } textarea { width: 100%; }`,
})
export class ViolationReviewModalComponent {
  private api = inject(ViolationService);
  v = input.required<Violation>();
  closed = output<void>();
  reviewed = output<Violation>();
  note = '';
  busy = signal(false);

  getImageUrl(path?: string | null): string {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    const clean = path.replace(/^\/+/, '').replace(/^images\//, '');
    return `http://localhost:8080/images/${clean}`;
  }

  submit(status: ReviewStatus): void {
    if (status === 'PENDING') return;
    this.busy.set(true);
    this.api.review(this.v().id, { reviewStatus: status, reviewNote: this.note || undefined }).subscribe({
      next: (r) => { this.reviewed.emit(r); this.closed.emit(); },
      error: () => this.busy.set(false),
    });
  }
}