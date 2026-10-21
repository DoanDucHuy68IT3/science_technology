import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    canActivate: [guestGuard], 
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginComponent) 
  },
 {
    path: 'signup', 
    loadComponent: () => import('./features/auth/sign-up/sign-up').then((m) => m.SignUp) // Điều chỉnh lại đường dẫn file sign-up nếu cần
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      { path: 'overview', title: 'Overview', loadComponent: () => import('./features/overview/overview').then((m) => m.OverviewComponent) },
      { path: 'camera-ai', title: 'Camera AI', loadComponent: () => import('./features/camera-ai/camera-ai').then((m) => m.CameraAiComponent) },
      { path: 'attendance', title: 'Điểm danh', loadComponent: () => import('./features/attendance/attendance').then((m) => m.AttendanceComponent) },
      { path: 'violations', title: 'Vi phạm', loadComponent: () => import('./features/violations/violations').then((m) => m.ViolationsComponent) },
      { path: 'students', title: 'Học sinh', loadComponent: () => import('./features/students/students').then((m) => m.StudentsComponent) },
      { path: 'devices', title: 'Thiết bị & Cảm biến', loadComponent: () => import('./features/devices/devices').then((m) => m.DevicesComponent) },
      { path: 'schedules', title: 'Lịch giám sát', loadComponent: () => import('./features/schedules/schedules').then((m) => m.SchedulesComponent) },
      { path: 'reports', title: 'Báo cáo', loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsComponent) },
      { path: 'settings', title: 'Cài đặt', loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];