import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { AttendanceService } from './attendance.service';
import { ViolationService } from './violation.service';
import { DeviceService } from './device.service';
import { ThresholdService } from './threshold.service';
import { AttendanceLog, SensorLog, Violation } from '../models';

export interface ViolationStat { name: string; count: number }
export interface AiQuality { total: number; verified: number; rejected: number; pending: number; precision: number }

/** Tổng hợp dữ liệu cho trang báo cáo (dùng chung các API hiện có). */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private att = inject(AttendanceService);
  private vio = inject(ViolationService);
  private dev = inject(DeviceService);
  private th = inject(ThresholdService);

  violations(from: string, to: string): Observable<Violation[]> {
    return this.vio.list({ from, to });
  }

  byType(list: Violation[]): ViolationStat[] {
    const m = new Map<string, number>();
    list.forEach((v) => m.set(v.violationTypeName, (m.get(v.violationTypeName) ?? 0) + 1));
    return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }

  aiQuality(list: Violation[]): AiQuality {
    const verified = list.filter((v) => v.reviewStatus === 'VERIFIED').length;
    const rejected = list.filter((v) => v.reviewStatus === 'REJECTED').length;
    const reviewed = verified + rejected;
    return { total: list.length, verified, rejected, pending: list.length - reviewed, precision: reviewed ? Math.round((verified / reviewed) * 100) : 0 };
  }

  late(): Observable<AttendanceLog[]> {
    return this.att.history().pipe(map((l) => l.filter((x) => x.status === 'LATE')));
  }

  /** Các thời điểm vượt ngưỡng trong khoảng đã chọn */
  envAlerts(mcuIds: number[]): Observable<(SensorLog & { reasons: string })[]> {
    return forkJoin(mcuIds.map((id) => this.dev.sensorLogs(id, 'WEEK'))).pipe(
      map((all) =>
        all.flat().map((s) => ({ s, ev: this.th.evaluate(s) })).filter((x) => x.ev.status !== 'NORMAL').map((x) => ({ ...x.s, reasons: x.ev.reasons.join(', ') })),
      ),
    );
  }
}
