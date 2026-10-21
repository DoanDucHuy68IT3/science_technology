import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, User } from '../models';

const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(this.readUser());
  readonly user = this._user.asReadonly();
  
  // Kiểm tra trạng thái đăng nhập chỉ dựa vào việc có tồn tại thông tin user hay không
  readonly isLoggedIn = computed(() => !!this._user());

  login(req: LoginRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap((user) => {
        
        // Chỉ lưu thông tin user vào localStorage mà không dùng token
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private readUser(): User | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    } catch {
      return null;
    }
  }
}