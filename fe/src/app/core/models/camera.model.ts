export type DeviceStatus = 'ONLINE' | 'OFFLINE';

/** Bảng camera_devices (kèm camera_device_details) */
export interface CameraDevice {
  id: number;
  cameraCode: string;
  userId: number;
  cameraName: string;
  ipAddress?: string;
  streamUrl: string;
  location?: string;
  status: DeviceStatus;
  lastSeen?: string;
  details?: CameraDeviceDetail;
  createdAt?: string;
  updatedAt?: string;
}

/** Bảng camera_device_details */
export interface CameraDeviceDetail {
  id?: number;
  cameraId?: number;
  description?: string;
  installationDate?: string;
  direction?: string;
}

/** Bảng camera_schedules */
export interface CameraSchedule {
  id: number;
  cameraId: number;
  scheduleName: string;
  /** HH:mm */
  startTime: string;
  endTime: string;
  /** "1,2,3,4,5" (1 = Thứ 2 ... 7 = Chủ nhật) */
  daysOfWeek: string;
  isActive: boolean;
}

/** Bảng camera_count_logs */
export interface CameraCountLog {
  id: number;
  cameraId: number;
  personCount: number;
  recordedAt: string;
}
