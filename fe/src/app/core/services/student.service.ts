import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Student, StudentPayload } from '../models';

const API = `${environment.apiUrl}/persons`;

export interface FaceRegisterResponse {
  status: number;
  message: string;
  person_id: number;
  sample_image_url: string;
  max_similarity: number;
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);

  list(): Observable<Student[]> {
    return this.http.get<Student[]>(API);
  }

  create(p: StudentPayload): Observable<Student> {
    return this.http.post<Student>(API, p);
  }

  update(id: number, p: StudentPayload): Observable<Student> {
    return this.http.put<Student>(`${API}/${id}`, p);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/${id}`);
  }

  /** Gửi FormData chứa file ảnh lên Spring Boot */
  registerFace(id: number, image: File): Observable<FaceRegisterResponse> {
    const fd = new FormData();
    fd.append('image', image, image.name || `face_${id}.jpg`);
    return this.http.post<FaceRegisterResponse>(`${API}/${id}/face`, fd);
  }
}