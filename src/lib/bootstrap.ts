/**
 * بارگذاری داده از دیتابیس، قبل از نمایش سایت.
 * اگر سرور نبود، همه‌چیز مثل قبل (داده‌ی نمونه + localStorage) می‌ماند.
 * اگر سرور بود ولی کاربر وارد نشده، داده‌ای بارگذاری نمی‌شود تا صفحه‌ی ورود بیاید.
 */

import { exams, scores, students } from '../data/mock';
import { fetchServerData, probeServer, pushPatch } from './api';
import { isLoggedIn, markLoggedOut } from './auth';
import { loadSavedImports } from './persist';
import { replaceRecords } from './records';
import { initSubjectThresholds } from './thresholds';

export const dataSource = {
  online: false,
  loadedAt: '',
};

export async function initDataSource(): Promise<void> {
  if (!(await probeServer())) return;

  /* سرور در دسترس است؛ تا ورود نکرده داده نمی‌خواهیم */
  dataSource.online = true;
  if (!isLoggedIn()) return;

  let data = await fetchServerData();
  if (!data) {
    markLoggedOut();
    return;
  }

  /* اولین اجرا با دیتابیس خالی: داده‌های قبلی همین مرورگر را یک‌بار منتقل کن */
  if (data.students.length === 0 && data.scores.length === 0) {
    const local = loadSavedImports();
    if (local && (local.students.length > 0 || local.scores.length > 0 || local.exams.length > 0)) {
      await pushPatch(local);
      data = (await fetchServerData()) ?? data;
    }
  }

  students.length = 0;
  students.push(...data.students);
  exams.length = 0;
  exams.push(...data.exams);
  scores.length = 0;
  scores.push(...data.scores);
  replaceRecords(data.records);
  await initSubjectThresholds();

  dataSource.loadedAt = new Date().toISOString();
}
