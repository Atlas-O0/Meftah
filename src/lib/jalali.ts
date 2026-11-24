/** تبدیل تاریخ میلادی به شمسی (برای پیش‌فرض تاریخ گزارش‌ها) */

const div = (a: number, b: number) => Math.floor(a / b);

export function toJalali(gy: number, gm: number, gd: number) {
  const gDayMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let year = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? year + 1 : year;
  let days =
    365 * year +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    gDayMonth[gm - 1];

  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** تاریخ امروز به شکل ۱۴۰۵-۰۹-۰۳ (همان قالبی که در داده‌ها استفاده می‌شود) */
export function todayJalali(): string {
  const now = new Date();
  const { jy, jm, jd } = toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${jy}-${pad(jm)}-${pad(jd)}`;
}
