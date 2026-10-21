/** Xuất CSV (UTF-8 BOM để Excel đọc đúng tiếng Việt). */
export function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]): void {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
  const body = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
