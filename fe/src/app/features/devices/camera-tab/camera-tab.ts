import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CameraDevice, User } from '../../../core/models';
import { CameraService } from '../../../core/services/camera.service';
import { ModalComponent, StatusBadgeComponent, TimeAgoPipe } from '../../../shared';

// Interface cho Person trả về từ API
interface Person {
  id: number;
  personCode: string;
  fullName: string;
  location: string;
  userId?: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const USER_KEY = 'user';
const ACTIVE_CAMERA_KEY = 'active_camera';

@Component({
  selector: 'app-camera-tab',
  imports: [FormsModule, DatePipe, ModalComponent, StatusBadgeComponent, TimeAgoPipe],
  template: `
    <div class="row" style="margin-bottom:12px">
      <span class="spacer muted">{{ rows().length }} camera</span>
      <button class="btn primary" (click)="edit(null)">+ Thêm camera</button>
    </div>
    
    <div class="card table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên & vị trí</th>
            <th>IP / URL luồng</th>
            <th>Trạng thái</th>
            <th>Lắp đặt</th>
            <th style="text-align: right;">Hành động</th>
          </tr>
        </thead>
        <tbody>
          @for (c of rows(); track c.id) {
            <tr (click)="selectCamera(c)" style="cursor: pointer;">
              <td>{{ c.cameraCode }}</td>
              <td><b>{{ c.cameraName }}</b><br /><small class="muted">{{ c.location }}</small></td>
              <td>{{ c.ipAddress }}<br /><small class="muted">{{ c.streamUrl }}</small></td>
              <td><app-status-badge [status]="c.status" /><br /><small class="muted">{{ c.lastSeen | timeAgo }}</small></td>
              <td>{{ c.details?.installationDate | date: 'dd/MM/yyyy' }}</td>
              <td class="row" style="justify-content: flex-end;" (click)="$event.stopPropagation()">
                <!-- Nút Xem học sinh tương ứng với đúng camera ở hàng c này -->
                <button class="btn sm" (click)="viewManagedPersons(c)">Xem học sinh</button>
                <button class="btn sm" (click)="edit(c)">Sửa</button>
                <button class="btn sm danger" (click)="remove(c)">Xóa</button>
              </td>
            </tr>
          } @empty { 
            <tr><td colspan="6" class="empty">Chưa có camera</td></tr> 
          }
        </tbody>
      </table>
    </div>

    <!-- Modal Thêm / Sửa Camera -->
    @if (form(); as f) {
      <app-modal [title]="f.id ? 'Sửa camera' : 'Thêm camera'" (closed)="form.set(null)">
        <div class="form-grid">
          <label class="f">Mã camera<input [(ngModel)]="f.cameraCode" /></label>
          <label class="f">Tên camera<input [(ngModel)]="f.cameraName" /></label>
          
          <label class="f">
            Địa chỉ IPv4
            <input [(ngModel)]="f.ipAddress" placeholder="Ví dụ: 192.168.1.100" />
          </label>

          <label class="f">Vị trí<input [(ngModel)]="f.location" /></label>
          
          <label class="f full">
            URL luồng video (RTSP)
            <input [(ngModel)]="f.streamUrl" placeholder="rtsp://[username:password@]ip[:port]/path" />
          </label>

          <label class="f">Ngày lắp đặt<input type="date" [(ngModel)]="det.installationDate" /></label>
          <label class="f">Hướng quay<input [(ngModel)]="det.direction" /></label>
          <label class="f full">Mô tả<textarea rows="2" [(ngModel)]="det.description"></textarea></label>
        </div>

        <div footer>
          <button class="btn" (click)="form.set(null)">Hủy</button>
          <button class="btn primary" [disabled]="!f.cameraCode || !f.cameraName || !f.streamUrl || !f.ipAddress" (click)="save(f)">Lưu</button>
        </div>
      </app-modal>
    }

    <!-- Modal Hiển thị Danh sách Học sinh của Camera được bấm -->
    @if (selectedCameraForPersons(); as cam) {
      <app-modal [title]="'Học sinh do camera ' + cam.cameraName + ' (' + cam.cameraCode + ') quản lý'" (closed)="closePersonsModal()">
        <div style="max-height: 400px; overflow-y: auto;">
          <table class="tbl" style="width: 100%;">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Họ và tên</th>
                <th>Vị trí / Lớp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              @for (p of managedPersons(); track p.id) {
                <tr>
                  <td>{{ p.personCode }}</td>
                  <td><b>{{ p.fullName }}</b></td>
                  <td>{{ p.location }}</td>
                  <td>
                    @if (p.isActive) {
                      <span class="badge success">Hoạt động</span>
                    } @else {
                      <span class="badge danger">Khóa</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="empty" style="text-align: center; padding: 20px;">
                    Không có học sinh nào thuộc vị trí ({{ cam.location || 'chưa đặt' }}) của camera này.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div footer>
          <button class="btn primary" (click)="closePersonsModal()">Đóng</button>
        </div>
      </app-modal>
    }
  `,
})
export class CameraTabComponent {
  private api = inject(CameraService);
  rows = signal<CameraDevice[]>([]);
  form = signal<Partial<CameraDevice> | null>(null);
  det: NonNullable<CameraDevice['details']> = {};
  
  // Quản lý state hiển thị học sinh theo camera từng hàng
  selectedCameraForPersons = signal<CameraDevice | null>(null);
  managedPersons = signal<Person[]>([]);

  private currentUserId: number | null = null;

  constructor() { 
    this.initUserAndLoad(); 
  }

  private initUserAndLoad(): void {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        const user: User = JSON.parse(userStr);
        this.currentUserId = user.id ?? null;
      }
    } catch (e) {
      console.error('Không thể đọc thông tin user từ localStorage', e);
    }

    if (this.currentUserId) {
      this.load(this.currentUserId);
    } else {
      console.warn('Không tìm thấy userId hợp lệ trong localStorage');
    }
  }

  load(userId: number): void { 
    this.api.getByUser(userId).subscribe({
      next: (r) => {
        this.rows.set(r);
        if (r && r.length > 0) {
          localStorage.setItem(ACTIVE_CAMERA_KEY, JSON.stringify(r[0]));
        } else {
          localStorage.removeItem(ACTIVE_CAMERA_KEY);
        }
      },
      error: (err) => {
        console.error('Không thể tải danh sách camera:', err);
      }
    }); 
  }

  selectCamera(c: CameraDevice): void {
    if (c && c.id) {
      localStorage.setItem(ACTIVE_CAMERA_KEY, JSON.stringify(c));
    }
  }

  /**
   * Lấy đúng cameraCode từ camera 'c' của hàng hiện tại
   */
  viewManagedPersons(c: CameraDevice): void {
    // 1. Đánh dấu camera được bấm & reset danh sách cũ
    this.selectedCameraForPersons.set(c);
    this.managedPersons.set([]);

    // 2. Cập nhật camera này làm camera active trong localStorage
    this.selectCamera(c);

    // 3. Lấy chính xác cameraCode của hàng này
    const cameraCode = c.cameraCode;

    // 4. Gọi API backend cho camera tương ứng
    fetch(`http://localhost:8080/api/cameras/code/${cameraCode}/persons`, {
      headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then((data: Person[]) => {
      this.managedPersons.set(data);
    })
    .catch(err => {
      console.error('Lỗi khi tải danh sách học sinh:', err);
      alert('Không thể tải danh sách học sinh!');
    });
  }

  closePersonsModal(): void {
    this.selectedCameraForPersons.set(null);
    this.managedPersons.set([]);
  }

  edit(c: CameraDevice | null): void {
    this.det = { ...(c?.details ?? {}) };
    this.form.set(
      c 
        ? { ...c } 
        : { cameraCode: '', cameraName: '', streamUrl: '', ipAddress: '', location: '', userId: this.currentUserId ?? undefined }
    );
  }

  private validateIPv4(ip: string): boolean {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }

  private validateRtspUrl(url: string): boolean {
    const rtspRegex = /^rtsp:\/\/(?:(?:[\w\-.]+:[^\s@]+@)?[a-zA-Z0-9.\-_]+)(?::\d+)?(?:\/[^\s?]*)?(?:\?[^\s]*)?$/i;
    return rtspRegex.test(url);
  }

  save(f: Partial<CameraDevice>): void {
    if (f.ipAddress && !this.validateIPv4(f.ipAddress)) {
      alert('Địa chỉ IP không đúng định dạng IPv4 hợp lệ (Ví dụ: 192.168.1.10)');
      return;
    }

    if (f.streamUrl && !this.validateRtspUrl(f.streamUrl)) {
      alert('URL luồng không đúng định dạng RTSP!\nĐịnh dạng chuẩn: rtsp://[username:password@]ip_address[:port]/path');
      return;
    }

    const isEdit = !!f.id;
    const payload = {
      ...f,
      details: this.det,
      userId: f.userId ?? this.currentUserId ?? undefined
    };

    this.api.save(payload).subscribe({
      next: () => { 
        this.form.set(null); 
        if (this.currentUserId) {
          this.load(this.currentUserId);
        }
        alert(isEdit ? 'Cập nhật camera thành công!' : 'Thêm camera thành công!');
      },
      error: (err) => {
        console.error('Lỗi khi lưu camera:', err);
        alert('Có lỗi xảy ra khi lưu camera. Vui lòng thử lại!');
      }
    });
  }

  remove(c: CameraDevice): void {
    if (confirm(`Bạn có chắc chắn muốn xóa camera ${c.cameraName}?`)) {
      this.api.remove(c.id).subscribe({
        next: () => {
          const savedActive = localStorage.getItem(ACTIVE_CAMERA_KEY);
          if (savedActive) {
            const parsedCam: CameraDevice = JSON.parse(savedActive);
            if (parsedCam.id === c.id) {
              localStorage.removeItem(ACTIVE_CAMERA_KEY);
            }
          }

          if (this.currentUserId) {
            this.load(this.currentUserId);
          }
          alert('Xóa camera thành công!');
        },
        error: (err) => {
          console.error('Lỗi khi xóa camera:', err);
          alert('Xóa camera thất bại. Vui lòng thử lại!');
        }
      });
    }
  }
}