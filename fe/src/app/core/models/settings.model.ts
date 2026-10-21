/** Ngưỡng cảnh báo môi trường */
export interface Thresholds {
  tempWarning: number;
  tempDanger: number;
  humidityHigh: number;
  gasWarning: number;
  gasDanger: number;
  smokeWarning: number;
  smokeDanger: number;
}

export interface PeriodTime {
  session: 'MORNING' | 'AFTERNOON' | 'EVENING';
  period: number;
  startTime: string;
  lateAfterMinutes: number;
}

export interface TelegramConfig {
  enabled: boolean;
  tokenTele: string;
  idChatTele: string;
}

export interface AppSettings {
  className: string;
  thresholds: Thresholds;
  timetable: PeriodTime[];
  telegram: TelegramConfig;
  /** Tiêu chí tác phong bật/tắt theo violation_types.code */
  criteria: Record<string, boolean>;
}

/** Thông báo realtime từ server */
export type RealtimeMessage =
  | { type: 'SENSOR'; payload: import('./mcu.model').SensorLog }
  | { type: 'VIOLATION'; payload: import('./violation.model').Violation }
  | { type: 'DEVICE_STATUS'; payload: { kind: 'CAMERA' | 'MCU'; id: number; status: 'ONLINE' | 'OFFLINE' } };

export interface AppNotification {
  id: number;
  kind: 'VIOLATION' | 'ENVIRONMENT' | 'DEVICE';
  title: string;
  time: string;
  read: boolean;
}
