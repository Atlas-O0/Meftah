/**
 * فیلتر کلاس مشترک: منوی بالای سایت و صفحه‌های دانش‌آموزان/آزمون‌ها/گزارش‌ها
 * از همین یک مقدار می‌خوانند. انتخاب در همین مرورگر ذخیره می‌شود.
 */

import { useSyncExternalStore } from 'react';
import { classes } from '../data/mock';

const KEY = 'meftah-class-filter-v1';

function read(): string {
  try {
    const value = localStorage.getItem(KEY);
    /* کلاس‌های تازه پیش از بارگذاری فهرست هم شناسایی می‌شوند (شناسه‌شان با cc- شروع می‌شود) */
    if (value && (classes.some((cls) => cls.id === value) || value.startsWith('cc-'))) return value;
  } catch {
    /* بی‌اهمیت */
  }
  return 'all';
}

let current = read();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getClassFilter = () => current;

export function setClassFilter(classId: string) {
  if (classId === current) return;
  current = classId;
  try {
    localStorage.setItem(KEY, classId);
  } catch {
    /* بی‌اهمیت */
  }
  listeners.forEach((listener) => listener());
}

export function useClassFilter(): string {
  return useSyncExternalStore(subscribe, getClassFilter, getClassFilter);
}

/** آیا فیلتر روی یک کلاس خاص است؟ */
export const classFilterActive = () => current !== 'all';

/** فیلتر کردن فهرست بر اساس کلاس انتخاب‌شده */
export function filterByClass<T extends { classId: string }>(items: T[]): T[] {
  return current === 'all' ? items : items.filter((item) => item.classId === current);
}
