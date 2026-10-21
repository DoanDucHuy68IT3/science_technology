import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReviewRequest, Violation, ViolationFilter, ViolationType } from '../models';

const API = `${environment.apiUrl}`;

@Injectable({ providedIn: 'root' })
export class ViolationService {
  private http = inject(HttpClient);

  types(): Observable<ViolationType[]> {
    return this.http.get<ViolationType[]>(`${API}/violation-types`);
  }

  list(f: ViolationFilter = {}): Observable<Violation[]> {
    let params = new HttpParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    // Trỏ trực tiếp vào endpoint /api/camera-logs của Spring Boot
    return this.http.get<Violation[]>(`${API}/camera-logs`, { params });
  }

  /** Giáo viên xác minh / bác bỏ cảnh báo AI */
  review(id: number, body: ReviewRequest): Observable<Violation> {
    // Trỏ trực tiếp vào endpoint review của /api/camera-logs
    return this.http.patch<Violation>(`${API}/camera-logs/${id}/review`, body);
  }
}