import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeviceMcu, SensorLog, SensorRange } from '../models';
import { MOCK_MCUS, genSensorLogs } from './mock-data';

const API = environment.apiUrl;
const mock = <T>(v: T) => of(v).pipe(delay(200));
const HOURS: Record<SensorRange, number> = { HOUR: 1, DAY: 24, WEEK: 24 * 7 };

/** Quản lý ESP32 (device_mcu) và dữ liệu cảm biến (sensor_logs) */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  private http = inject(HttpClient);

  list(): Observable<DeviceMcu[]> {
    if (!environment.useMock) return this.http.get<DeviceMcu[]>(`${API}/mcu`);
    return mock(MOCK_MCUS.map((m) => ({ ...m, latest: genSensorLogs(m.id, 1).at(-1) })));
  }

  save(d: Partial<DeviceMcu>): Observable<DeviceMcu> {
    if (!environment.useMock) return d.id ? this.http.put<DeviceMcu>(`${API}/mcu/${d.id}`, d) : this.http.post<DeviceMcu>(`${API}/mcu`, d);
    if (d.id) {
      const m = MOCK_MCUS.find((x) => x.id === d.id)!;
      Object.assign(m, d);
      return mock(m);
    }
    const m = { ...d, id: Date.now(), userId: 1, status: 'OFFLINE' } as DeviceMcu;
    MOCK_MCUS.push(m);
    return mock(m);
  }

  remove(id: number): Observable<void> {
    if (!environment.useMock) return this.http.delete<void>(`${API}/mcu/${id}`);
    const i = MOCK_MCUS.findIndex((x) => x.id === id);
    if (i >= 0) MOCK_MCUS.splice(i, 1);
    return mock(undefined);
  }

  sensorLogs(mcuId: number, range: SensorRange = 'DAY'): Observable<SensorLog[]> {
    if (!environment.useMock) return this.http.get<SensorLog[]>(`${API}/mcu/${mcuId}/sensor-logs`, { params: { range } });
    return mock(genSensorLogs(mcuId, HOURS[range]));
  }

  latest(mcuId: number): Observable<SensorLog | undefined> {
    return this.sensorLogs(mcuId, 'HOUR').pipe(map((l) => l.at(-1)));
  }

  /** Trợ lý AI môi trường: server dựng prompt từ sensor_logs + ngưỡng, gọi LLM */
  askAssistant(question: string, mcuId?: number): Observable<{ answer: string }> {
    if (!environment.useMock) return this.http.post<{ answer: string }>(`${API}/assistant/environment`, { question, mcuId });
    return mock({
      answer:
        'Dựa trên dữ liệu cảm biến gần nhất (dữ liệu mô phỏng), các chỉ số đang trong ngưỡng cấu hình. ' +
        'Nếu có mùi gas/khói hoặc cảnh báo kéo dài, hãy kiểm tra trực tiếp khu vực, thông gió và báo bộ phận phụ trách theo quy trình an toàn của trường. ' +
        'Câu trả lời này chỉ mang tính tham khảo, không thay thế việc kiểm tra thực tế.',
    }).pipe(delay(600));
  }
}
