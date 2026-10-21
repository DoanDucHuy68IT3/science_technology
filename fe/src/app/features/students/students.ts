import { Component, computed, inject, input, signal, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Student, StudentPayload } from '../../core/models';
import { StudentService } from '../../core/services/student.service';
import { AutoFocusDirective, ModalComponent } from '../../shared';
import { getCurrentUserId } from '../students/getCurrentUserId';

const EMPTY: StudentPayload = { personCode: '', fullName: '', location: '11A1', userId: null, description: '', isActive: true };

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule, ModalComponent, AutoFocusDirective],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>🎓 Học sinh</h1>
          <p class="sub">{{ rows().length }} học sinh · {{ registered() }} đã đăng ký khuôn mặt</p>
        </div>
        <div class="row">
          <input [(ngModel)]="keyword" placeholder="Tìm tên / mã HS..." />
          <button class="btn primary" (click)="edit(null)">+ Thêm học sinh</button>
        </div>
      </div>

      <div class="card table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Mã học sinh</th>
              <th>Họ và tên</th>
              <th>Lớp</th>
              <th>Ảnh khuôn mặt</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            @for (s of shown(); track s.id) {
              <tr>
                <td>{{ s.personCode }}</td>
                <td>{{ s.fullName }}</td>
                <td>{{ s.location }}</td>
                <td>
                  <!-- Chỉ cần có sampleImageUrl hoặc faceRegistered = true là hiển thị ảnh ngay -->
                  @if (s.sampleImageUrl || s.faceRegistered) {
                    <div class="face-thumb-container" (click)="viewImage(s)">
                      <img 
                        [src]="getImageUrl(s.sampleImageUrl)" 
                        alt="Ảnh khuôn mặt" 
                        class="thumb-img" 
                        title="Nhấp để xem lớn"
                        (error)="onImgError($event)" 
                      />
                    </div>
                  } @else {
                    <span class="badge gray">Chưa có ảnh</span>
                  }
                </td>
                <td>
                  <span class="badge" [class.ok]="s.isActive" [class.gray]="!s.isActive">
                    {{ s.isActive ? 'Hoạt động' : 'Ngừng theo dõi' }}
                  </span>
                </td>
                <td class="row">
                  <button class="btn sm" (click)="openFaceModal(s)">📷 Khuôn mặt</button>
                  <button class="btn sm" (click)="edit(s)">Sửa</button>
                  <button class="btn sm" (click)="history(s, 'attendance')">Điểm danh</button>
                  <button class="btn sm" (click)="history(s, 'violations')">Vi phạm</button>
                  @if (s.isActive) { <button class="btn sm danger" (click)="deactivate(s)">Ngừng</button> }
                </td>
              </tr>
            } @empty { 
              <tr><td colspan="6" class="empty">Không có học sinh</td></tr> 
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Thêm / Sửa học sinh -->
    @if (form(); as f) {
      <app-modal [title]="editingId() ? 'Sửa học sinh' : 'Thêm học sinh'" (closed)="form.set(null)">
        <div class="form-grid">
          <label class="f">Mã học sinh<input appAutoFocus [(ngModel)]="f.personCode" /></label>
          <label class="f">Họ và tên<input [(ngModel)]="f.fullName" /></label>
          <label class="f">Lớp<input [(ngModel)]="f.location" /></label>
          <label class="f">Trạng thái<select [(ngModel)]="f.isActive"><option [ngValue]="true">Hoạt động</option><option [ngValue]="false">Ngừng theo dõi</option></select></label>
          <label class="f full">Ghi chú<textarea rows="2" [(ngModel)]="f.description"></textarea></label>
        </div>
        <div footer><button class="btn" (click)="form.set(null)">Hủy</button><button class="btn primary" [disabled]="!f.personCode || !f.fullName" (click)="save(f)">Lưu</button></div>
      </app-modal>
    }

    <!-- Modal Xem chi tiết ảnh khuôn mặt lớn -->
    @if (viewingStudent(); as vs) {
      <app-modal [title]="'Chi tiết khuôn mặt — ' + vs.fullName" [width]="450" (closed)="viewingStudent.set(null)">
        <div class="text-center" style="text-align: center;">
          @if (vs.sampleImageUrl) {
            <img 
              class="pv-large" 
              [src]="getImageUrl(vs.sampleImageUrl)" 
              alt="Ảnh khuôn mặt chi tiết"
            />
            <p class="muted" style="margin-top: 12px; font-size: 13px;">Đường dẫn file: {{ vs.sampleImageUrl }}</p>
          } @else {
            <p class="muted">Học sinh này chưa có ảnh mẫu khuôn mặt.</p>
          }
        </div>
        <div footer>
          <button class="btn primary" (click)="viewingStudent.set(null)">Đóng</button>
        </div>
      </app-modal>
    }

    <!-- Modal Đăng ký khuôn mặt chọn 2 hình thức -->
    @if (faceFor(); as s) {
      <app-modal [title]="'Đăng ký khuôn mặt — ' + s.fullName" [width]="500" (closed)="closeFace()">
        <p class="muted">Chọn phương thức lấy ảnh khuôn mặt học sinh:</p>
        
        <div class="row mode-select" style="margin-bottom: 16px; gap: 8px;">
          <button class="btn" [class.primary]="faceMode() === 'file'" (click)="setFaceMode('file')">📁 Chọn file ảnh</button>
          <button class="btn" [class.primary]="faceMode() === 'webcam'" (click)="setFaceMode('webcam')">📷 Dùng Camera máy tính</button>
        </div>

        @if (faceMode() === 'file') {
          <div class="face-section">
            <input type="file" accept="image/*" (change)="onFile($event)" />
            @if (preview()) { <img class="pv" [src]="preview()" alt="Xem trước" /> }
          </div>
        }

        @if (faceMode() === 'webcam') {
          <div class="face-section webcam-box">
            <video #webcamVideo autoplay playsinline muted class="pv"></video>
            <canvas #webcamCanvas style="display:none;"></canvas>
            <div style="margin-top: 10px; text-align: center;">
              <button class="btn primary" (click)="captureWebcam()">📸 Chụp ảnh khuôn mặt</button>
            </div>
            @if (preview()) {
              <div style="margin-top: 10px;">
                <p class="muted" style="margin-bottom: 4px;">Ảnh đã chụp:</p>
                <img class="pv" [src]="preview()" alt="Ảnh chụp webcam" />
              </div>
            }
          </div>
        }

        <div footer>
          <button class="btn" (click)="closeFace()">Hủy</button>
          <button class="btn primary" [disabled]="!file || busy()" (click)="uploadFace(s)">
            {{ busy() ? 'Đang xử lý AI...' : 'Xác nhận đăng ký' }}
          </button>
        </div>
      </app-modal>
    }`,
  styles: `
    .pv { width: 100%; max-height: 260px; object-fit: contain; margin-top: 12px; border-radius: 10px; background: #0f172a; }
    .pv-large { width: 100%; max-height: 350px; object-fit: contain; border-radius: 8px; background: #0f172a; border: 1px solid #334155; }
    .face-thumb-container { display: inline-block; cursor: pointer; transition: transform 0.2s; }
    .face-thumb-container:hover { transform: scale(1.08); }
    .thumb-img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  `,
})
export class StudentsComponent implements OnDestroy {
  private api = inject(StudentService);
  private router = inject(Router);
  q = input<string>();

  // id user đang đăng nhập (lấy từ localStorage) và key cache riêng cho từng user
  private get uid(): number | null { return getCurrentUserId(); }
  private get cacheKey(): string { return `managed_persons_${this.uid ?? 'guest'}`; }

  rows = signal<Student[]>([]);
  
  private _keyword = signal('');
  get keyword(): string { return this._keyword(); }
  set keyword(val: string) { this._keyword.set(val); }

  form = signal<StudentPayload | null>(null);
  editingId = signal<number | null>(null);
  
  faceFor = signal<Student | null>(null);
  viewingStudent = signal<Student | null>(null);
  faceMode = signal<'file' | 'webcam'>('file');
  preview = signal('');
  busy = signal(false);
  file: File | null = null;

  webcamVideo = viewChild<ElementRef<HTMLVideoElement>>('webcamVideo');
  webcamCanvas = viewChild<ElementRef<HTMLCanvasElement>>('webcamCanvas');
  private mediaStream: MediaStream | null = null;

  registered = computed(() => this.rows().filter((s) => s.faceRegistered || !!s.sampleImageUrl).length);
  
  shown = computed(() => {
    const k = (this._keyword() || this.q() || '').toLowerCase();
    return k ? this.rows().filter((s) => s.fullName.toLowerCase().includes(k) || s.personCode.toLowerCase().includes(k)) : this.rows();
  });

  constructor() { 
    const cached = localStorage.getItem(this.cacheKey);
    if (cached) {
      try {
        const parsed: Student[] = JSON.parse(cached);
        const normalized = parsed.map(s => ({
          ...s,
          faceRegistered: s.faceRegistered || !!s.sampleImageUrl
        }));
        this.rows.set(normalized);
      } catch (e) {
        console.error('Lỗi đọc cache localStorage:', e);
      }
    }
    this.load(); 
  }

  ngOnDestroy(): void {
    this.stopWebcam();
    this.cleanupPreview();
  }

  load(): void { 
    this.api.list().subscribe({
      next: (allData) => {
        // Chỉ lấy học sinh do user hiện tại quản lý (persons.user_id)
        const serverData = this.uid == null ? allData : allData.filter(s => s.userId === this.uid);

        const cachedStr = localStorage.getItem(this.cacheKey);
        let mergedData = serverData;

        if (cachedStr) {
          try {
            const cachedData: Student[] = JSON.parse(cachedStr);
            mergedData = serverData.map(serverItem => {
              const cachedItem = cachedData.find(c => c.id === serverItem.id);
              const sampleUrl = serverItem.sampleImageUrl || cachedItem?.sampleImageUrl;
              const isRegistered = serverItem.faceRegistered || cachedItem?.faceRegistered || !!sampleUrl;

              return {
                ...serverItem,
                faceRegistered: isRegistered,
                sampleImageUrl: sampleUrl
              };
            });
          } catch (e) {
            console.error('Lỗi merge cache:', e);
          }
        } else {
          mergedData = serverData.map(s => ({
            ...s,
            faceRegistered: s.faceRegistered || !!s.sampleImageUrl
          }));
        }

        this.rows.set(mergedData);
        localStorage.setItem(this.cacheKey, JSON.stringify(mergedData));
      },
      error: (err) => {
        console.error('Lỗi tải danh sách từ server, giữ nguyên dữ liệu từ localStorage...', err);
      }
    }); 
  }

  // 👉 Nối trực tiếp domain backend Spring Boot 8080
  getImageUrl(urlPath: string | undefined): string {
    if (!urlPath) return '';
    if (urlPath.startsWith('http')) return urlPath;
    
    const backendBaseUrl = 'http://localhost:8080';
    const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
    return `${backendBaseUrl}${cleanPath}`;
  }

  onImgError(event: Event): void {
    const imgEl = event.target as HTMLImageElement;
    if (imgEl) {
      imgEl.style.display = 'none';
    }
  }

  viewImage(s: Student): void {
    this.viewingStudent.set(s);
  }

  edit(s: Student | null): void {
    this.editingId.set(s?.id ?? null);
    this.form.set(s
      ? { personCode: s.personCode, fullName: s.fullName, location: s.location, userId: s.userId ?? this.uid, description: s.description, isActive: s.isActive }
      : { ...EMPTY, userId: this.uid });
  }

  save(f: StudentPayload): void {
    f.userId = f.userId ?? this.uid; // bắt buộc có userId, vì PUT ghi đè user_id
    const id = this.editingId();
    const request$ = id ? this.api.update(id, f) : this.api.create(f);

    request$.subscribe({
      next: () => {
        this.form.set(null);
        this.load();
        alert(id ? 'Cập nhật thông tin học sinh thành công!' : 'Thêm học sinh thành công!');
      },
      error: () => alert('Có lỗi xảy ra, vui lòng kiểm tra lại!')
    });
  }

  deactivate(s: Student): void {
    if (confirm(`Bạn có chắc chắn muốn ngừng theo dõi học sinh ${s.fullName}?`)) {
      this.api.deactivate(s.id).subscribe({
        next: () => {
          this.load();
          alert(`Đã ngừng theo dõi học sinh ${s.fullName}!`);
        },
        error: () => alert('Thực hiện không thành công!')
      });
    }
  }

  history(s: Student, where: 'attendance' | 'violations'): void {
    this.router.navigate([where === 'violations' ? '/violations' : '/attendance'], { queryParams: { q: s.fullName } });
  }

  openFaceModal(s: Student): void {
    this.faceFor.set(s);
    this.setFaceMode('file');
  }

  setFaceMode(mode: 'file' | 'webcam'): void {
    this.faceMode.set(mode);
    this.cleanupPreview();
    this.file = null;

    if (mode === 'webcam') {
      setTimeout(() => this.startWebcam(), 100);
    } else {
      this.stopWebcam();
    }
  }

  async startWebcam(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
      });
      const videoEl = this.webcamVideo()?.nativeElement;
      if (videoEl) {
        videoEl.srcObject = this.mediaStream;
      }
    } catch (err) {
      console.error('Không thể truy cập camera:', err);
      alert('Không thể mở được webcam. Vui lòng kiểm tra quyền truy cập thiết bị!');
      this.setFaceMode('file');
    }
  }

  stopWebcam(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  captureWebcam(): void {
    const videoEl = this.webcamVideo()?.nativeElement;
    const canvasEl = this.webcamCanvas()?.nativeElement;

    if (!videoEl || !canvasEl) return;

    canvasEl.width = videoEl.videoWidth || 640;
    canvasEl.height = videoEl.videoHeight || 480;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

    canvasEl.toBlob((blob) => {
      if (blob) {
        this.file = new File([blob], `webcam_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.cleanupPreview();
        this.preview.set(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.95);
  }

  onFile(e: Event): void {
    const inputEl = e.target as HTMLInputElement;
    if (inputEl.files && inputEl.files[0]) {
      this.file = inputEl.files[0];
      this.cleanupPreview();
      this.preview.set(URL.createObjectURL(this.file));
    }
  }

  uploadFace(s: Student): void {
    if (!this.file) {
      alert('Vui lòng chọn hoặc chụp ảnh khuôn mặt trước!');
      return;
    }
    
    this.busy.set(true);
    
    this.api.registerFace(s.id, this.file).subscribe({ 
      next: (res: any) => { 
        this.busy.set(false); 
        this.closeFace(); 
        
        const imgUrl = res?.sample_image_url || res?.sampleImageUrl || `/faces/${s.id}.jpeg`;

        const updatedRows = this.rows().map(item => {
          if (item.id === s.id) {
            return {
              ...item,
              faceRegistered: true,
              sampleImageUrl: imgUrl
            };
          }
          return item;
        });

        this.rows.set(updatedRows);
        localStorage.setItem(this.cacheKey, JSON.stringify(updatedRows));

        alert(`✅ Đăng ký khuôn mặt thành công cho học sinh ${s.fullName}!`);
      }, 
      error: (err) => {
        this.busy.set(false);
        const errMsg = err.error?.detail || err.error?.message || 'Đăng ký khuôn mặt thất bại. Vui lòng thử lại!';
        alert(`❌ Lỗi: ${errMsg}`);
      } 
    });
  }

  closeFace(): void { 
    this.stopWebcam();
    this.cleanupPreview();
    this.faceFor.set(null); 
    this.file = null; 
  }

  private cleanupPreview(): void {
    if (this.preview().startsWith('blob:')) {
      URL.revokeObjectURL(this.preview());
    }
    this.preview.set('');
  }
}