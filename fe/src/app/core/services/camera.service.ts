import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CameraCountLog, CameraDevice, CameraSchedule } from '../models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class CameraService {
  private http = inject(HttpClient);

  // Lấy toàn bộ danh sách camera
  list(): Observable<CameraDevice[]> {
    return this.http.get<CameraDevice[]>(`${API}/cameras`);
  }

  // Lấy danh sách camera theo userId
  getByUser(userId: number): Observable<CameraDevice[]> {
    return this.http.get<CameraDevice[]>(`${API}/cameras/user/${userId}`);
  }

  // --- BỔ SUNG: Lấy chi tiết camera theo ID (khớp với GET /cameras/{id}) ---
  getById(id: number): Observable<CameraDevice> {
    return this.http.get<CameraDevice>(`${API}/cameras/${id}`);
  }

  // Lưu camera (Thêm mới nếu không có id, Cập nhật nếu có id)
  save(cam: Partial<CameraDevice>): Observable<CameraDevice> {
    return cam.id 
      ? this.http.put<CameraDevice>(`${API}/cameras/${cam.id}`, cam) 
      : this.http.post<CameraDevice>(`${API}/cameras`, cam);
  }

  // Xóa camera theo id
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/cameras/${id}`);
  }

  // Lấy lịch sử log đếm người của camera
  counts(cameraId: number): Observable<CameraCountLog[]> {
    return this.http.get<CameraCountLog[]>(`${API}/cameras/${cameraId}/counts`);
  }

  // ----- Camera Schedules -----

  schedules(): Observable<CameraSchedule[]> {
    return this.http.get<CameraSchedule[]>(`${API}/camera-schedules`);
  }

  saveSchedule(s: Partial<CameraSchedule>): Observable<CameraSchedule> {
    return s.id 
      ? this.http.put<CameraSchedule>(`${API}/camera-schedules/${s.id}`, s) 
      : this.http.post<CameraSchedule>(`${API}/camera-schedules`, s);
  }

  removeSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/camera-schedules/${id}`);
  }
}