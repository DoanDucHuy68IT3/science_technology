import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppSettings, Thresholds } from '../models';
import { MOCK_SETTINGS } from './mock-data';

const API = `${environment.apiUrl}/settings`;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  /** Ngưỡng hiện hành, dùng chung cho Overview / ESP32 tab */
  readonly thresholds = signal<Thresholds>(MOCK_SETTINGS.thresholds);

  load(): Observable<AppSettings> {
    const r$ = environment.useMock ? of(structuredClone(MOCK_SETTINGS)).pipe(delay(200)) : this.http.get<AppSettings>(API);
    return r$.pipe(tap((s) => this.thresholds.set(s.thresholds)));
  }

  save(s: AppSettings): Observable<AppSettings> {
    if (environment.useMock) {
      Object.assign(MOCK_SETTINGS, structuredClone(s));
      this.thresholds.set(s.thresholds);
      return of(s).pipe(delay(300));
    }
    return this.http.put<AppSettings>(API, s).pipe(tap((x) => this.thresholds.set(x.thresholds)));
  }

  testTelegram(): Observable<{ ok: boolean }> {
    return environment.useMock ? of({ ok: true }).pipe(delay(400)) : this.http.post<{ ok: boolean }>(`${API}/telegram/test`, {});
  }
}
