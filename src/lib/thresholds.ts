/**
 * مرز «خوب» و «متوسط» برای هر درس، جدا برای آزمون تستی (درصد) و تشریحی (نمره).
 * در دیتابیس سرور ذخیره می‌شود و بدون سرور در همین مرورگر می‌ماند.
 */

import { subjects } from '../data/mock';
import { fetchSettings, isServerOnline, saveSettings } from './api';

export type ThresholdKind = 'percent' | 'score';

export interface SubjectThreshold {
  good: number;
  pass: number;
}

export type SubjectThresholdSet = Record<ThresholdKind, SubjectThreshold>;
export type SubjectThresholdMap = Record<string, SubjectThresholdSet>;

/** سقف نمره‌ی تشریحی برای مرزها */
export const SCORE_LIMIT = 20;

export const DEFAULT_THRESHOLD: SubjectThresholdSet = {
  percent: { good: 70, pass: 50 },
  score: { good: 12, pass: 10 },
};

const KEY = 'meftah-subject-thresholds-v1';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function cloneDefault(): SubjectThresholdMap {
  return Object.fromEntries(
    subjects.map((subject) => [
      subject.id,
      { percent: { ...DEFAULT_THRESHOLD.percent }, score: { ...DEFAULT_THRESHOLD.score } },
    ]),
  );
}

/** مرز «خوب» نباید از «متوسط» پایین‌تر باشد */
function normalize(set: SubjectThresholdSet): SubjectThresholdSet {
  for (const kind of ['percent', 'score'] as const) {
    set[kind].good = Math.max(set[kind].good, set[kind].pass);
  }
  return set;
}

function sanitize(input: unknown): SubjectThresholdMap | null {
  if (!input || typeof input !== 'object') return null;
  const source = input as Record<string, unknown>;
  const merged = cloneDefault();
  for (const subject of subjects) {
    const entry = source[subject.id] as Record<string, { good?: unknown; pass?: unknown }> | undefined;
    if (!entry) continue;
    for (const kind of ['percent', 'score'] as const) {
      const value = entry[kind];
      if (!value) continue;
      const limit = kind === 'percent' ? 100 : SCORE_LIMIT;
      const good = Number(value.good);
      const pass = Number(value.pass);
      if (Number.isFinite(good)) merged[subject.id][kind].good = clamp(good, 0, limit);
      if (Number.isFinite(pass)) merged[subject.id][kind].pass = clamp(pass, 0, limit);
    }
    normalize(merged[subject.id]);
  }
  return merged;
}

function loadLocal(): SubjectThresholdMap | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

let map: SubjectThresholdMap | null = null;

export function getSubjectThresholds(): SubjectThresholdMap {
  if (!map) map = loadLocal() ?? cloneDefault();
  return map;
}

export function defaultSubjectThresholds(): SubjectThresholdMap {
  return cloneDefault();
}

export function thresholdsFor(subjectId: string, kind: ThresholdKind): SubjectThreshold {
  return getSubjectThresholds()[subjectId]?.[kind] ?? DEFAULT_THRESHOLD[kind];
}

/** وضعیت یک نمره بر اساس مرز همان درس */
export function subjectLevel(
  value: number,
  maxScore: number,
  subjectId: string,
  kind: ThresholdKind,
): { label: string; tone: 'green' | 'amber' | 'red'; percent: number } {
  const threshold = thresholdsFor(subjectId, kind);
  const percent = maxScore > 0 ? (value / maxScore) * 100 : 0;
  if (kind === 'percent') {
    if (value >= threshold.good) return { label: 'خوب', tone: 'green', percent };
    if (value >= threshold.pass) return { label: 'متوسط', tone: 'amber', percent };
    return { label: 'نیازمند توجه', tone: 'red', percent };
  }
  if (value >= threshold.good) return { label: 'خوب', tone: 'green', percent };
  if (value >= threshold.pass) return { label: 'متوسط', tone: 'amber', percent };
  return { label: 'نیازمند توجه', tone: 'red', percent };
}

export function setSubjectThresholds(next: SubjectThresholdMap) {
  map = sanitize(next) ?? cloneDefault();
  persist();
}

export function resetSubjectThresholds(): SubjectThresholdMap {
  map = cloneDefault();
  persist();
  return map;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(map ?? cloneDefault()));
  } catch {
    /* بی‌اهمیت */
  }
  if (map) void saveSettings({ subjectThresholds: map });
}

/** بارگذاری از دیتابیس (و انتقال مقدار مرورگر در اولین اجرا) */
export async function initSubjectThresholds(): Promise<void> {
  const local = loadLocal();
  if (isServerOnline()) {
    const remote = await fetchSettings();
    const remoteMap = sanitize(remote?.subjectThresholds);
    if (remoteMap) {
      map = remoteMap;
      try {
        localStorage.setItem(KEY, JSON.stringify(remoteMap));
      } catch {
        /* بی‌اهمیت */
      }
      return;
    }
    if (local) {
      map = local;
      void saveSettings({ subjectThresholds: local });
      return;
    }
  }
  if (!map) map = local ?? cloneDefault();
}
