const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/** تبدیل ارقام لاتین به فارسی */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** عدد با حداکثر یک رقم اعشار و علامت درصد */
export function faPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const fixed = value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1');
  return `${fa(fixed)}٪`;
}

/** نمره‌ی خام (مثلاً ۱۷٫۲۵) */
export function faScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return fa(fixed.replace('.', '٫'));
}

/** تاریخ ۱۴۰۴-۰۸-۱۵ → ۱۴۰۴/۰۸/۱۵ */
export function faDate(iso: string): string {
  return fa(iso.replace(/-/g, '/'));
}

export function initials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}
