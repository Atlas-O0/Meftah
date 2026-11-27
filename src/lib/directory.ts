/**
 * فهرست کلاس‌ها و معلم‌ها.
 * کلاس‌های پایه در `data/mock` هستند (۱۲۱ تا ۱۲۶)؛ کلاس‌های تازه از تنظیمات
 * ساخته می‌شوند و روی همین دستگاه + دیتابیس سرور نگه داشته می‌شوند.
 */

import { useSyncExternalStore } from 'react';
import { classes, type ClassRoom, type TrackId } from '../data/mock';
import { fetchSettings, isServerOnline, saveSettings } from './api';

export interface Teacher {
  id: string;
  name: string;
  role: string;
  classes: string;
}

interface Directory {
  classes: ClassRoom[];
  teachers: Teacher[];
}

const KEY = 'meftah-directory-v1';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const seedTeachers: Teacher[] = [
  { id: 't1', name: 'خانم موسوی', role: 'مدیر و دبیر حسابان', classes: '۱۲۱ · ۱۲۲ — ریاضی فیزیک' },
  { id: 't2', name: 'آقای رستمی', role: 'دبیر فیزیک', classes: '۱۲۳ ریاضی فیزیک · ۱۲۴ تجربی' },
  { id: 't3', name: 'خانم کاظمی', role: 'دبیر زیست‌شناسی', classes: '۱۲۵ · ۱۲۶ — تجربی' },
];

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const toLatin = (input: string) =>
  Array.from(input)
    .map((char) => {
      const p = PERSIAN_DIGITS.indexOf(char);
      if (p >= 0) return String(p);
      const a = ARABIC_DIGITS.indexOf(char);
      return a >= 0 ? String(a) : char;
    })
    .join('');

/** برای نمایش و ذخیره‌ی نام کلاس، ارقام فارسی تا با بقیه‌ی کلاس‌ها یکدست باشد */
const toPersianDigits = (input: string) => input.replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);

function sanitizeClass(input: unknown): ClassRoom | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  const track: TrackId = row.track === 'math' ? 'math' : 'science';
  return {
    id,
    name,
    grade: text(row.grade) || 'دوازدهم',
    track,
    teacher: text(row.teacher) || '—',
  };
}

function sanitizeTeacher(input: unknown): Teacher | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Record<string, unknown>;
  const id = text(row.id);
  const name = text(row.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    role: text(row.role) || 'دبیر',
    classes: text(row.classes) || '—',
  };
}

function load(): Directory {
  let custom: ClassRoom[] = [];
  let teachers = seedTeachers;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as { classes?: unknown; teachers?: unknown };
      if (Array.isArray(data.classes)) {
        custom = data.classes.map(sanitizeClass).filter((item): item is ClassRoom => item !== null);
      }
      if (Array.isArray(data.teachers)) {
        const list = data.teachers
          .map(sanitizeTeacher)
          .filter((item): item is Teacher => item !== null);
        if (list.length) teachers = list;
      }
    }
  } catch {
    /* بی‌اهمیت */
  }
  return { classes: custom, teachers };
}

let directory: Directory = load();
let version = 0;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const bump = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

/** کلاس‌های ذخیره‌شده را به فهرست کلاس‌های سایت اضافه می‌کند (قبل از رندر) */
export function hydrateDirectoryClasses() {
  for (const cls of directory.classes) {
    if (!classes.some((item) => item.id === cls.id)) classes.push(cls);
  }
}

hydrateDirectoryClasses();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(directory));
  } catch {
    /* بی‌اهمیت */
  }
  if (isServerOnline()) {
    void saveSettings({ directory: { classes: directory.classes, teachers: directory.teachers } });
  }
}

/* ----------------------------- خواندن ----------------------------- */

/** برای به‌روز شدن صفحه بعد از افزودن/حذف (خروجی فقط برای رندر است) */
export function useDirectoryVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}

export function getDirectory(): Directory {
  return directory;
}

export const getTeachers = (): Teacher[] => directory.teachers;
export const getCustomClasses = (): ClassRoom[] => directory.classes;

/* ----------------------------- نوشتن ----------------------------- */

export function addClass(input: {
  name: string;
  track: TrackId;
  teacher?: string;
}): { ok: true; cls: ClassRoom } | { ok: false; error: string } {
  const digits = toLatin(text(input.name));
  if (!digits) return { ok: false, error: 'نام کلاس را وارد کن.' };
  if (!/^\d{2,4}$/.test(digits)) return { ok: false, error: 'نام کلاس باید عدد باشد؛ مثلاً ۱۲۷.' };
  if (classes.some((cls) => toLatin(cls.name) === digits)) {
    return { ok: false, error: 'کلاسی با این نام از قبل هست.' };
  }
  const track: TrackId = input.track === 'math' ? 'math' : 'science';
  const cls: ClassRoom = {
    id: `cc-${Date.now().toString(36)}`,
    name: toPersianDigits(digits),
    grade: 'دوازدهم',
    track,
    teacher: text(input.teacher) || '—',
  };
  classes.push(cls);
  directory = { ...directory, classes: [...directory.classes, cls] };
  persist();
  bump();
  return { ok: true, cls };
}

export function addTeacher(input: {
  name: string;
  role?: string;
  classes?: string;
}): { ok: true; teacher: Teacher } | { ok: false; error: string } {
  const name = text(input.name);
  if (!name) return { ok: false, error: 'نام معلم را وارد کن.' };
  if (directory.teachers.some((item) => item.name === name)) {
    return { ok: false, error: 'معلمی با این نام از قبل هست.' };
  }
  const teacher: Teacher = {
    id: `t-${Date.now().toString(36)}`,
    name,
    role: text(input.role) || 'دبیر',
    classes: text(input.classes) || '—',
  };
  directory = { ...directory, teachers: [...directory.teachers, teacher] };
  persist();
  bump();
  return { ok: true, teacher };
}

export function removeTeacher(id: string) {
  directory = { ...directory, teachers: directory.teachers.filter((teacher) => teacher.id !== id) };
  persist();
  bump();
}

/** خواندن فهرست ذخیره‌شده روی سرور (بعد از ورود) */
export async function syncDirectory() {
  if (!isServerOnline()) return;
  const settings = await fetchSettings();
  const remote = (settings as { directory?: { classes?: unknown; teachers?: unknown } } | null)?.directory;
  const remoteClasses = Array.isArray(remote?.classes)
    ? remote.classes.map(sanitizeClass).filter((item): item is ClassRoom => item !== null)
    : [];
  const remoteTeachers = Array.isArray(remote?.teachers)
    ? remote.teachers.map(sanitizeTeacher).filter((item): item is Teacher => item !== null)
    : [];

  if (remoteClasses.length || remoteTeachers.length) {
    directory = {
      classes: remoteClasses,
      teachers: remoteTeachers.length ? remoteTeachers : directory.teachers,
    };
    hydrateDirectoryClasses();
    try {
      localStorage.setItem(KEY, JSON.stringify(directory));
    } catch {
      /* بی‌اهمیت */
    }
    bump();
  } else {
    /* اولین اجرا: فهرست همین دستگاه روی سرور ذخیره شود */
    persist();
  }
}
