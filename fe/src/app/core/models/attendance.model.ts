export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';
export type SessionName = 'MORNING' | 'AFTERNOON' | 'EVENING';

/** Bảng bổ sung: attendance_logs */
export interface AttendanceLog {
  id: number;
  personId: number;
  personCode: string;
  personName: string;
  attendanceDate: string;
  session: SessionName;
  period: number;
  status: AttendanceStatus;
  checkedAt?: string;
  cameraId?: number;
}

/** Tổng hợp theo tiết */
export interface PeriodSummary {
  session: SessionName;
  period: number;
  present: number;
  late: number;
  total: number;
}

export interface AttendanceOverview {
  total: number;
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceTrend {
  date: string;
  rate: number;
}

/** Bảng bổ sung: classrooms */
export interface Classroom {
  id: number;
  className: string;
  homeroomTeacherId: number;
  studentCount?: number;
}

export const SESSION_LABEL: Record<SessionName, string> = {
  MORNING: 'Sáng',
  AFTERNOON: 'Chiều',
  EVENING: 'Tối',
};
