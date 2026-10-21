export const pad = (n: number) => String(n).padStart(2, "0");

/** yyyy-MM-dd theo giờ địa phương */
export function toDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60000).toISOString();
}

/** "HH:mm" -> số phút trong ngày */
export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
