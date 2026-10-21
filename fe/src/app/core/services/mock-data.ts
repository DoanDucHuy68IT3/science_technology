import {
  AppSettings, AttendanceLog, CameraDevice, CameraSchedule, DeviceMcu, SensorLog, Student, User, Violation, ViolationType,
} from "../models";
import { minutesAgo, toDateStr } from "../../shared/utils/date.util";

/** Dữ liệu giả - chỉ dùng khi environment.useMock = true */
export const MOCK_USER: User = {
  id: 1, username: "giaovien", fullName: "Cô Nguyễn Thu Hà", email: "ha.nt@school.edu.vn", phone: "0912345678",
  role: "TEACHER", isActive: true, tokenTele: "", idChatTele: "",
};
const names = ["Nguyễn Văn A", "Trần Văn B", "Lê Thị C", "Phạm Minh D", "Hoàng Gia E", "Vũ Thùy F", "Đặng Quốc G", "Bùi Thanh H", "Ngô Hải I", "Đỗ Khánh K"];
export const MOCK_STUDENTS: Student[] = names.map((n, i) => ({
  id: i + 1, 
  personCode: `HS${String(i + 1).padStart(4, "0")}`, 
  fullName: n, 
  className: "11A1",
  location: "Khu A - Tầng 1", // <-- Thêm dòng này để khớp với kiểu Student
  isActive: true, 
  faceRegistered: i !== 7,
}));

export const MOCK_VIOLATION_TYPES: ViolationType[] = [
  { id: 1, code: "NO_SCARF", name: "Không đeo khăn quàng", description: "Học sinh không đeo khăn quàng đỏ", isActive: true },
  { id: 2, code: "WRONG_UNIFORM", name: "Sai đồng phục", description: "Không đúng quy định đồng phục", isActive: true },
  { id: 3, code: "NO_TUCK", name: "Không sơ vin", description: "Áo chưa sơ vin", isActive: true },
  { id: 4, code: "WRONG_SHOES", name: "Giày dép không đúng quy định", isActive: true },
  { id: 5, code: "SMOKING", name: "Hành vi hút thuốc", description: "Cảnh báo hút thuốc", isActive: true },
];

export const MOCK_CAMERAS: CameraDevice[] = [
  { id: 1, cameraCode: "CAM-01", userId: 1, cameraName: "Cổng trường", ipAddress: "192.168.1.101", streamUrl: "rtsp://192.168.1.101/live", location: "Cổng chính", status: "ONLINE", lastSeen: minutesAgo(1), details: { description: "Camera cổng", installationDate: "2026-01-10", direction: "Hướng vào" } },
  { id: 2, cameraCode: "CAM-02", userId: 1, cameraName: "Hành lang tầng 2", ipAddress: "192.168.1.102", streamUrl: "rtsp://192.168.1.102/live", location: "Hành lang A2", status: "ONLINE", lastSeen: minutesAgo(2), details: { description: "Hành lang", installationDate: "2026-01-12", direction: "Dọc hành lang" } },
  { id: 3, cameraCode: "CAM-03", userId: 1, cameraName: "Nhà vệ sinh khu B", ipAddress: "192.168.1.103", streamUrl: "rtsp://192.168.1.103/live", location: "Khu B", status: "OFFLINE", lastSeen: minutesAgo(180), details: { description: "Khu vực khuất", installationDate: "2026-02-01", direction: "Cửa ra vào" } },
];

export const MOCK_SCHEDULES: CameraSchedule[] = [
  { id: 1, cameraId: 1, scheduleName: "Ca sáng", startTime: "06:30", endTime: "11:30", daysOfWeek: "1,2,3,4,5", isActive: true },
  { id: 2, cameraId: 1, scheduleName: "Ca chiều", startTime: "13:00", endTime: "17:00", daysOfWeek: "1,2,3,4,5", isActive: true },
  { id: 3, cameraId: 2, scheduleName: "Giờ vào lớp", startTime: "06:30", endTime: "07:30", daysOfWeek: "1,2,3,4,5", isActive: true },
];

export const MOCK_MCUS: DeviceMcu[] = [
  { id: 1, macAddress: "24:6F:28:AA:BB:01", userId: 1, deviceName: "ESP32 Lớp 11A1", location: "Phòng 11A1", status: "ONLINE", lastSeen: minutesAgo(0) },
  { id: 2, macAddress: "24:6F:28:AA:BB:02", userId: 1, deviceName: "ESP32 Hành lang", location: "Hành lang A2", status: "OFFLINE", lastSeen: minutesAgo(95) },
];

/** Sinh lịch sử cảm biến giả cho `hours` giờ gần nhất, mỗi 10 phút */
export function genSensorLogs(mcuId: number, hours: number): SensorLog[] {
  const out: SensorLog[] = [];
  const n = hours * 6;
  for (let i = n; i >= 0; i--) {
    const t = n - i;
    out.push({
      id: mcuId * 100000 + t, mcuId,
      temperature: +(27 + 3 * Math.sin(t / 18) + Math.random()).toFixed(1),
      humidity: +(65 + 8 * Math.cos(t / 22) + Math.random() * 2).toFixed(1),
      gasLevel: +(180 + 40 * Math.sin(t / 9) + Math.random() * 15 + (t % 97 === 0 ? 250 : 0)).toFixed(0) as unknown as number,
      smokeLevel: +(120 + 30 * Math.cos(t / 11) + Math.random() * 10).toFixed(0) as unknown as number,
      recordedAt: minutesAgo(i * 10),
    });
  }
  return out;
}

const mk = (id: number, mins: number, p: number | null, t: number, conf: number, st: Violation["reviewStatus"]): Violation => {
  const s = p ? MOCK_STUDENTS[p - 1] : null;
  const vt = MOCK_VIOLATION_TYPES[t - 1];
  return {
    id, cameraId: 1 + (id % 2), cameraName: id % 2 ? "Hành lang tầng 2" : "Cổng trường",
    personId: p, personName: s?.fullName ?? null, personCode: s?.personCode ?? null,
    violationTypeId: vt.id, violationTypeCode: vt.code, violationTypeName: vt.name,
    detectedAt: minutesAgo(mins), confidence: conf, reviewStatus: st, sourceEventId: `EVT-${id}`,
    imageUrl: "",
  };
};
export const MOCK_VIOLATIONS: Violation[] = [
  mk(1, 40, 1, 1, 0.94, "PENDING"), mk(2, 30, 2, 3, 0.91, "PENDING"), mk(3, 5, null, 5, 0.78, "PENDING"),
  mk(4, 120, 3, 2, 0.88, "VERIFIED"), mk(5, 200, 4, 4, 0.83, "REJECTED"), mk(6, 25, 5, 1, 0.9, "PENDING"),
  mk(7, 300, 6, 3, 0.86, "VERIFIED"), mk(8, 1500, 7, 1, 0.92, "VERIFIED"), mk(9, 2900, 8, 2, 0.8, "REJECTED"),
];

export function genAttendance(): AttendanceLog[] {
  const out: AttendanceLog[] = [];
  const today = toDateStr();
  let id = 1;
  for (const [session, periods] of [["MORNING", 4], ["AFTERNOON", 2]] as const) {
    for (let p = 1; p <= periods; p++) {
      for (const s of MOCK_STUDENTS) {
        const miss = (s.id * 7 + p * 3 + (session === "MORNING" ? 0 : 5)) % 11 === 0;
        if (miss && p > 1) continue;
        const late = !miss && p === 1 && s.id % 6 === 0;
        out.push({ id: id++, personId: s.id, personCode: s.personCode, personName: s.fullName, attendanceDate: today, session, period: p, status: late ? "LATE" : "PRESENT", checkedAt: minutesAgo(60) });
      }
    }
  }
  return out;
}

export const MOCK_SETTINGS: AppSettings = {
  className: "11A1",
  thresholds: { tempWarning: 33, tempDanger: 38, humidityHigh: 85, gasWarning: 400, gasDanger: 600, smokeWarning: 300, smokeDanger: 500 },
  timetable: [
    { session: "MORNING", period: 1, startTime: "07:00", lateAfterMinutes: 5 },
    { session: "MORNING", period: 2, startTime: "07:50", lateAfterMinutes: 5 },
    { session: "MORNING", period: 3, startTime: "08:55", lateAfterMinutes: 5 },
    { session: "MORNING", period: 4, startTime: "09:45", lateAfterMinutes: 5 },
    { session: "AFTERNOON", period: 1, startTime: "13:30", lateAfterMinutes: 5 },
    { session: "AFTERNOON", period: 2, startTime: "14:20", lateAfterMinutes: 5 },
  ],
  telegram: { enabled: false, tokenTele: "", idChatTele: "" },
  criteria: { NO_SCARF: true, WRONG_UNIFORM: true, NO_TUCK: true, WRONG_SHOES: true, SMOKING: true },
};
