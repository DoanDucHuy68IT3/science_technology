import { Component, computed, input } from '@angular/core';
import { REVIEW_LABEL, ReviewStatus } from '../../core/models';

const MAP: Record<string, [string, string]> = {
  PENDING: [REVIEW_LABEL.PENDING, 'warn'], VERIFIED: [REVIEW_LABEL.VERIFIED, 'ok'], REJECTED: [REVIEW_LABEL.REJECTED, 'gray'],
  ONLINE: ['Trực tuyến', 'ok'], OFFLINE: ['Ngoại tuyến', 'gray'],
  NORMAL: ['Bình thường', 'ok'], WARNING: ['Cảnh báo', 'warn'], DANGER: ['Nguy hiểm', 'danger'],
  PRESENT: ['Có mặt', 'ok'], LATE: ['Đi muộn', 'warn'], ABSENT: ['Vắng', 'danger'],
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="cls()">{{ text() }}</span>`,
})
export class StatusBadgeComponent {
  status = input.required<ReviewStatus | string>();
  private m = computed(() => MAP[this.status()] ?? [this.status(), '']);
  text = computed(() => this.m()[0]);
  cls = computed(() => this.m()[1]);
}
