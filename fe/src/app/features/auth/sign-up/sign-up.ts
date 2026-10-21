import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; /// Điều chỉnh đường dẫn environment của bạn

// Custom Validator kiểm tra mật khẩu trùng khớp
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  // Trạng thái loading và thông báo lỗi
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Khởi tạo Form với Reactive Forms và Validators
  signUpForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  onSubmit() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = this.signUpForm.value;
    
    // Xóa trường confirmPassword trước khi gửi lên API backend
    const payload = {
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: 'user' // Mặc định role
    };

    // Gọi API đăng ký (Thay đổi URL endpoint theo backend của bạn)
    this.http.post(`${environment.apiUrl}/auth/register`, payload).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.successMessage.set('🎉 Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
        setTimeout(() => {
          this.router.navigate(['/login']); // Điều hướng về trang đăng nhập sau 2 giây
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        const errorMsg = err.error?.message || err.error?.detail || 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã tồn tại!';
        this.errorMessage.set(errorMsg);
      }
    });
  }
}