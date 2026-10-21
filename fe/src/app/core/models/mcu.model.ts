import { DeviceStatus } from './camera.model';

/** Bảng device_mcu */
export interface DeviceMcu {
  id: number;
  macAddress: string;
  userId: number;
  deviceName: string;
  location?: string;
  status: DeviceStatus;
  lastSeen?: string;
  latest?: SensorLog;
}

/** Bảng sensor_logs */
export interface SensorLog {
  id: number;
  mcuId: number;
  temperature: number;
  humidity: number;
  /** MQ-2: giá trị thô/đã quy đổi, chưa hiệu chuẩn ppm */
  gasLevel: number;
  smokeLevel: number;
  recordedAt: string;
}

export type EnvStatus = 'NORMAL' | 'WARNING' | 'DANGER';

export interface EnvEvaluation {
  status: EnvStatus;
  reasons: string[];
}

export type SensorRange = 'HOUR' | 'DAY' | 'WEEK';
