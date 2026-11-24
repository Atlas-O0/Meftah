/**
 * گزارش‌های دانش‌آموزان (انضباطی، فرهنگی، پژوهشی، ورزشی).
 * در این نسخه‌ی نمایشی فقط در حافظه‌ی همان تب نگه داشته می‌شود؛
 * با رفرش صفحه به داده‌ی اولیه برمی‌گردد. در مرحله‌ی بعد به SQLite وصل می‌شود.
 */

import { useSyncExternalStore } from 'react';
import {
  records as seedRecords,
  type RecordCategory,
  type RecordKind,
  type StudentRecord,
} from '../data/mock';
import { getDataMode } from './mode';

export const categoryTone: Record<RecordCategory, 'blue' | 'amber' | 'green' | 'red'> = {
  انضباطی: 'red',
  فرهنگی: 'amber',
  پژوهشی: 'blue',
  ورزشی: 'green',
};

export const kindTone: Record<RecordKind, 'green' | 'blue' | 'amber' | 'red' | 'gray'> = {
  تشویق: 'green',
  فعالیت: 'blue',
  تذکر: 'amber',
  غیبت: 'red',
  مشاوره: 'gray',
};

let items: StudentRecord[] = getDataMode() === 'demo' ? [...seedRecords] : [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export function subscribeRecords(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecords(): StudentRecord[] {
  return items;
}

export function addRecord(record: Omit<StudentRecord, 'id'>): StudentRecord {
  const next: StudentRecord = { ...record, id: `local-${Date.now()}-${items.length + 1}` };
  items = [next, ...items];
  emit();
  return next;
}

export function removeRecord(id: string) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function useRecords(): StudentRecord[] {
  return useSyncExternalStore(subscribeRecords, getRecords, getRecords);
}

/** گزارش‌های یک دانش‌آموز، جدیدترین اول */
export function useStudentRecords(studentId: string): StudentRecord[] {
  return useRecords().filter((record) => record.studentId === studentId);
}
