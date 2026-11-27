/**
 * ارتباط با سرور (Bun + SQLite).
 * اگر سرور در دسترس نباشد، سایت مثل قبل در حالت مرورگر (localStorage) کار می‌کند.
 */

import type { Exam, Score, Student, StudentRecord } from '../data/mock';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const configured = (env?.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

/** آدرس پایه‌ی API؛ خالی = همان آدرس سایت (پیش‌فرض هنگام اجرای سرور) */
export const apiBase = configured;
export const apiUrl = (path: string) => `${apiBase}${path}`;

let online = false;

export const isServerOnline = () => online;

export interface DataPatch {
  students?: Student[];
  exams?: Exam[];
  scores?: Score[];
  records?: StudentRecord[];
  removedRecords?: string[];
}

export interface ServerCounts {
  students: number;
  exams: number;
  scores: number;
  records: number;
}

export interface ServerData {
  students: Student[];
  exams: Exam[];
  scores: Score[];
  records: StudentRecord[];
}

export interface ServerHealth {
  ok: boolean;
  database: string;
  backupDir: string;
  counts: ServerCounts;
}

export async function probeServer(timeoutMs = 2500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(apiUrl('/api/health'), { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!response.ok) return (online = false);
    const data = (await response.json()) as Partial<ServerHealth>;
    online = data?.ok === true && typeof data.database === 'string';
  } catch {
    online = false;
  }
  return online;
}

export async function fetchHealth(): Promise<ServerHealth | null> {
  try {
    const response = await fetch(apiUrl('/api/health'), { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as ServerHealth;
  } catch {
    return null;
  }
}

export async function fetchServerData(): Promise<ServerData | null> {
  try {
    const response = await fetch(apiUrl('/api/bootstrap'), { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<ServerData>;
    if (!Array.isArray(data.students) || !Array.isArray(data.scores)) return null;
    return {
      students: data.students,
      exams: Array.isArray(data.exams) ? data.exams : [],
      scores: data.scores,
      records: Array.isArray(data.records) ? data.records : [],
    };
  } catch {
    return null;
  }
}

export async function pushPatch(patch: DataPatch): Promise<boolean> {
  if (!online) return false;
  try {
    const response = await fetch(apiUrl('/api/patch'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function pushClear(): Promise<boolean> {
  if (!online) return false;
  try {
    const response = await fetch(apiUrl('/api/clear'), { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

export const backupUrl = () => apiUrl('/api/backup');

/* ---------------- تنظیمات ذخیره‌شده روی سرور ---------------- */

export interface AppSettings {
  subjectThresholds?: Record<string, unknown>;
  /** کلاس‌ها و معلم‌های ساخته‌شده در تنظیمات */
  directory?: { classes?: unknown[]; teachers?: unknown[] };
  /** مرز سطح هر سری و ضریب درس‌ها */
  seriesThresholds?: Record<string, unknown>;
  subjectWeights?: Record<string, unknown>;
}

export async function fetchSettings(): Promise<AppSettings | null> {
  if (!online) return null;
  try {
    const response = await fetch(apiUrl('/api/settings'), { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as { settings?: AppSettings };
    return data.settings ?? {};
  } catch {
    return null;
  }
}

export async function saveSettings(patch: AppSettings): Promise<boolean> {
  if (!online) return false;
  try {
    const response = await fetch(apiUrl('/api/settings'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return response.ok;
  } catch {
    return false;
  }
}
