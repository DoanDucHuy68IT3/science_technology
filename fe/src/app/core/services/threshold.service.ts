import { Injectable, inject } from '@angular/core';
import { EnvEvaluation, SensorLog } from '../models';
import { SettingsService } from './settings.service';

/**
 * Đánh giá trạng thái môi trường theo ngưỡng cấu hình.
 * Lưu ý: MQ-2 chưa hiệu chuẩn thì giá trị chỉ mang tính tương đối, không phải ppm chính xác.
 */
@Injectable({ providedIn: 'root' })
export class ThresholdService {
  private settings = inject(SettingsService);

  evaluate(s: SensorLog | undefined | null): EnvEvaluation {
    if (!s) return { status: 'NORMAL', reasons: [] };
    const t = this.settings.thresholds();
    const reasons: string[] = [];
    let level = 0;
    const check = (v: number, warn: number, danger: number, label: string) => {
      if (v >= danger) { level = 2; reasons.push(`${label} vượt ngưỡng nguy hiểm`); }
      else if (v >= warn) { level = Math.max(level, 1); reasons.push(`${label} vượt ngưỡng cảnh báo`); }
    };
    check(s.temperature, t.tempWarning, t.tempDanger, 'Nhiệt độ');
    check(s.gasLevel, t.gasWarning, t.gasDanger, 'Khí gas');
    check(s.smokeLevel, t.smokeWarning, t.smokeDanger, 'Khói');
    if (s.humidity >= t.humidityHigh) { level = Math.max(level, 1); reasons.push('Độ ẩm cao'); }
    return { status: (['NORMAL', 'WARNING', 'DANGER'] as const)[level], reasons };
  }
}
