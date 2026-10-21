// Đổi 'user' thành đúng key bạn thấy trong DevTools > Application > Local Storage
const USER_KEY = 'user';

export function getCurrentUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);

    // Dự phòng: tìm giá trị JSON nào trông giống user (có id và username)
    for (let i = 0; i < localStorage.length; i++) {
      const v = localStorage.getItem(localStorage.key(i)!);
      if (!v || v[0] !== '{') continue;
      const o = JSON.parse(v);
      const u = o?.user ?? o;
      if (u?.id != null && u?.username) return u;
    }
  } catch { /* JSON lỗi */ }
  return null;
}

export function getCurrentUserId(): number | null {
  const id = getCurrentUser()?.id;
  return id != null && !isNaN(Number(id)) ? Number(id) : null;
}