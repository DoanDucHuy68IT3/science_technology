import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, delay, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceLog, AttendanceOverview, AttendanceTrend, PeriodSummary, SessionName, Student } from '../models';
import { MOCK_STUDENTS, genAttendance } from './mock-data';
import { addDays, toDateStr } from '../../shared/utils/date.util';

const API = `${environment.apiUrl}/attendance`;
const mock = <T>(v: T) => of(v).pipe(delay(200));
let MOCK_LOGS: AttendanceLog[] | null = null;
const logs = () => (MOCK_LOGS ??= genAttendance());

/** Điểm danh dựa trên bảng attendance_logs (không dùng camera_count_logs để xác định có mặt). */
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);

  overview(date: string, session?: SessionName, period?: number): Observable<AttendanceOverview> {
    if (!environment.useMock) return this.http.get<AttendanceOverview>(`${API}/overview`, { params: this.params({ date, session, period }) });
    const total = MOCK_STUDENTS.filter((s) => s.isActive).length;
    const rows = this.mockRows(date, session, period);
    const ids = new Set(rows.map((r) => r.personId));
    const late = new Set(rows.filter((r) => r.status === 'LATE').map((r) => r.personId)).size;
    return mock({ total, present: ids.size, absent: total - ids.size, late });
  }

  periods(date: string): Observable<PeriodSummary[]> {
    if (!environment.useMock) return this.http.get<PeriodSummary[]>(`${API}/periods`, { params: this.params({ date }) });
    const total = MOCK_STUDENTS.length;
    const map = new Map<string, PeriodSummary>();
    for (const r of this.mockRows(date)) {
      const k = `${r.session}-${r.period}`;
      const e = map.get(k) ?? { session: r.session, period: r.period, present: 0, late: 0, total };
      e.present++;
      if (r.status === 'LATE') e.late++;
      map.set(k, e);
    }
    return mock([...map.values()]);
  }

  /** Học sinh chưa có bản ghi trong tiết đang chọn */
  absentees(date: string, session: SessionName, period: number): Observable<Student[]> {
    if (!environment.useMock) return this.http.get<Student[]>(`${API}/absentees`, { params: this.params({ date, session, period }) });
    const ids = new Set(this.mockRows(date, session, period).map((r) => r.personId));
    return mock(MOCK_STUDENTS.filter((s) => s.isActive && !ids.has(s.id)));
  }

  trend(days: number): Observable<AttendanceTrend[]> {
    if (!environment.useMock) return this.http.get<AttendanceTrend[]>(`${API}/trend`, { params: this.params({ days }) });
    return mock(Array.from({ length: days }, (_, i) => ({ date: toDateStr(addDays(new Date(), i - days + 1)), rate: 90 + ((i * 37) % 10) })));
  }

  history(personId?: number, from?: string, to?: string): Observable<AttendanceLog[]> {
    if (!environment.useMock) return this.http.get<AttendanceLog[]>(`${API}/history`, { params: this.params({ personId, from, to }) });
    return mock(logs().filter((l) => !personId || l.personId === personId));
  }

  private mockRows(date: string, session?: SessionName, period?: number) {
    return logs().filter((l) => l.attendanceDate === date && (!session || l.session === session) && (!period || l.period === period));
  }

  private params(o: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    Object.entries(o).forEach(([k, v]) => v !== undefined && v !== null && (p = p.set(k, String(v))));
    return p;
  }
}
