import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, ElementRef, viewChildren, effect, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Hls from 'hls.js';
import { Violation } from '../../core/models';
import { CameraDevice } from '../../core/models/camera.model';
import { RealtimeService } from '../../core/services/realtime.service';
import { ViolationService } from '../../core/services/violation.service';
import { CameraService } from '../../core/services/camera.service';
import { ConfidencePipe, StatusBadgeComponent } from '../../shared';
import { ViolationReviewModalComponent } from '../violations/violation-review-modal';

interface AlertCard { code: string; icon: string; color: string; title: string; desc: string }

const ALERTS: AlertCard[] = [
  { code: 'NO_SCARF', icon: '🔴', color: '#dc2626', title: 'Không đeo khăn quàng', desc: 'Phát hiện học sinh không đeo khăn quàng đỏ' },
  { code: 'WRONG_UNIFORM', icon: '🟠', color: '#f97316', title: 'Sai đồng phục', desc: 'Phát hiện dấu hiệu không đúng quy định' },
  { code: 'NO_TUCK', icon: '🟡', color: '#eab308', title: 'Không sơ vin', desc: 'Phát hiện dấu hiệu áo chưa sơ vin' },
  { code: 'WRONG_SHOES', icon: '🔵', color: '#2563eb', title: 'Giày dép không đúng quy định', desc: 'Phát hiện giày dép không đáp ứng quy định' },
  { code: 'SMOKING', icon: '🚭', color: '#7c3aed', title: 'Hành vi hút thuốc', desc: 'Cảnh báo khi mô hình hỗ trợ phát hiện' },
];

@Component({
  selector: 'app-camera-ai',
  imports: [DatePipe, StatusBadgeComponent, ConfidencePipe, ViolationReviewModalComponent],
  templateUrl: './camera-ai.html',
  styleUrl: './camera-ai.scss',
})
export class CameraAiComponent implements OnDestroy {
  private api = inject(ViolationService);
  private rt = inject(RealtimeService);
  private cameraService = inject(CameraService);

  cards = ALERTS;

  cameras = signal<(CameraDevice & { hlsUrl: string })[]>([]);
  all = signal<Violation[]>([]);
  filter = signal('');
  selected = signal<Violation | null>(null);

  // Lấy danh sách tất cả các thẻ video trên giao diện HTML (#videoPlayer)
  videoPlayers = viewChildren<ElementRef<HTMLVideoElement>>('videoPlayer');

  events = computed(() => this.all().filter((v) => !this.filter() || v.violationTypeCode === this.filter()).slice(0, 30));
  countOf = (code: string) => this.all().filter((v) => v.violationTypeCode === code).length;

  private hlsInstances: Map<string, Hls> = new Map();

  constructor() {
    this.reload();
    this.rt.violation$.pipe(takeUntilDestroyed()).subscribe((v) => this.all.update((l) => [v, ...l]));

    // 1. Tải danh sách camera từ API/LocalStorage và tạo URL HLS từ cameraCode
    this.loadAllCamerasAndStream();

    // 2. Tự động khởi tạo HLS player cho từng luồng video khi DOM và danh sách camera đã sẵn sàng
    effect(() => {
      const camList = this.cameras();
      const videoElements = this.videoPlayers();

      if (camList.length > 0 && videoElements.length > 0) {
        setTimeout(() => {
          videoElements.forEach((videoRef, index) => {
            const cam = camList[index];
            if (cam && videoRef?.nativeElement) {
              this.initHlsForVideo(videoRef.nativeElement, cam.hlsUrl, cam.cameraCode);
            }
          });
        }, 50);
      }
    });
  }

  ngOnDestroy(): void {
    // Dọn dẹp HLS instances giải phóng tài nguyên RAM khi component bị huỷ
    this.hlsInstances.forEach((hls) => hls.destroy());
    this.hlsInstances.clear();
  }

  initHlsForVideo(video: HTMLVideoElement, url: string, cameraCode: string): void {
    // Huỷ luồng cũ nếu cameraCode đã tồn tại
    if (this.hlsInstances.has(cameraCode)) {
      this.hlsInstances.get(cameraCode)?.destroy();
      this.hlsInstances.delete(cameraCode);
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      this.hlsInstances.set(cameraCode, hls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Dành cho trình duyệt Safari iOS
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
      });
    }
  }

  loadAllCamerasAndStream(): void {
    const userJson = localStorage.getItem('user');

    if (!userJson) {
      console.error('Không tìm thấy thông tin user trong localStorage');
      this.cameras.set([]);
      return;
    }

    let user: { id: number; username?: string };

    try {
      user = JSON.parse(userJson);
    } catch (error) {
      console.error('Dữ liệu user trong localStorage không hợp lệ:', error);
      this.cameras.set([]);
      return;
    }

    if (!Number.isInteger(user.id) || user.id <= 0) {
      console.error('ID người dùng không hợp lệ:', user.id);
      this.cameras.set([]);
      return;
    }

    this.cameraService.getByUser(user.id).subscribe({
      next: (res: CameraDevice[]) => {
        if (!Array.isArray(res)) {
          console.error('API không trả về danh sách camera hợp lệ');
          return;
        }

        // Cổng HLS mặc định của MediaMTX là 8888 (có thể thay đổi tuỳ cấu hình mediamtx.yml của bạn)
        const MEDIAMTX_HLS_PORT = 8888;

        // Ghép cameraCode trực tiếp vào công thức URL: http://localhost:8888/<cameraCode>/index.m3u8
        const mappedCameras = res.map((cam) => ({
          ...cam,
          hlsUrl: `http://localhost:${MEDIAMTX_HLS_PORT}/camera/${cam.cameraCode}/index.m3u8`,
        }));

        localStorage.setItem('allCamerasHls', JSON.stringify(mappedCameras));
        this.cameras.set(mappedCameras);
        console.log('Đã tải và ghép URL HLS thành công:', mappedCameras);
      },

      error: (err: any) => {
        console.error('Không thể tải danh sách camera từ API:', err);

        const cached = localStorage.getItem('allCamerasHls');

        if (cached) {
          try {
            const cachedCameras = JSON.parse(cached);
            this.cameras.set(Array.isArray(cachedCameras) ? cachedCameras : []);
          } catch (error) {
            console.error('Danh sách camera lưu cục bộ không hợp lệ:', error);
            this.cameras.set([]);
          }
        } else {
          this.cameras.set([]);
        }
      },
    });
  }

  reload(): void {
    this.api.list().subscribe((v) => this.all.set(v));
  }

  toggleFull(event: Event): void {
    const cardEl = (event.currentTarget as HTMLElement).closest('.video-box') as HTMLElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      cardEl?.requestFullscreen?.();
    }
  }
}