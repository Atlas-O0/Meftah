/**
 * حالت داده‌ی سایت.
 * demo = داده‌ی نمونه‌ی ساختگی هم نمایش داده می‌شود (برای دیدن ظاهر).
 * real = فقط داده‌ی واقعی (واردشده از اکسل/دستی) نمایش داده می‌شود.
 */

export type DataMode = 'demo' | 'real';

const KEY = 'meftah-data-mode';

export function getDataMode(): DataMode {
  try {
    return localStorage.getItem(KEY) === 'real' ? 'real' : 'demo';
  } catch {
    return 'demo';
  }
}

export function setDataMode(mode: DataMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* بی‌اهمیت */
  }
}
