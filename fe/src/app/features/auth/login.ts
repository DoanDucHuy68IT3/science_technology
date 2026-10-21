import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // ✅ Đã thêm RouterLink
import { AuthService } from '../../core/services/auth.service';
import { CameraService } from '../../core/services/camera.service';  

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink], // ✅ Đã thêm RouterLink vào đây
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cameraService = inject(CameraService);
  
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit(): void {
    if (!this.username || !this.password) { 
      this.error.set('Vui lòng nhập đầy đủ thông tin'); 
      return; 
    }
    
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl'] ?? '/overview');
      },
      error: () => { 
        this.loading.set(false); 
        this.error.set('Sai tên đăng nhập hoặc mật khẩu'); 
      },
    });  
  }
}