/**
 * تنظیمات سطح‌بندی و وزن‌ها: مرز «قوی/خوب/قبولی» هر سری و ضریب هر درس.
 * در همین مرورگر و (اگر سرور بالاست) در جدول settings نگه داشته می‌شود.
 */

import { series, subjects } from '../data/mock';
import { fetchSettings, isServerOnline, saveSettings } from './api';

export interface SeriesThresholds {
  strong: number;
  good: number;
  pass: number;
}

export type SeriesThresholdMap = Record<string, SeriesThresholds>;
export type WeightMap = Record<string, number>;

const KEY = 'meftah-scoring-v1';
const WEIGHT_MIN = 1;
const WEIGHT_MAX = 5;

const defaults: { series: SeriesThresholdMap; weights: WeightMap } = {
  series: Object.fromEntries(series.map((item) => [item.id, { ...item.thresholds }])),
  weights: Object.fromEntries(subjects.map((subject) => [subject.id, subject.weight])),
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function sanitizeThresholds(input: unknown): SeriesThresholdMap {
  const result: SeriesThresholdMap = { ...defaults.series };
  if (!input || typeof input !== 'object') return result;
  for (const item of series) {
    const raw = (input as Record<string, unknown>)[item.id];
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const strong = Number(row.strong);
    const good = Number(row.good);
    const pass = Number(row.pass);
    if (![strong, good, pass].every((value) => Number.isFinite(value))) continue;
    const next = {
      pass: clamp(pass, 0, 100),
      good: clamp(good, 0, 100),
      strong: clamp(strong, 0, 100),
    };
    next.good = Math.max(next.good, next.pass);
    next.strong = Math.max(next.strong, next.good);
    result[item.id] = next;
  }
  return result;
}

function sanitizeWeights(input: unknown): WeightMap {
  const result: WeightMap = { ...defaults.weights };
  if (!input || typeof input !== 'object') return result;
  for (const subject of subjects) {
    const value = Number((input as Record<string, unknown>)[subject.id]);
    if (!Number.isFinite(value)) continue;
    result[subject.id] = Math.round(clamp(value, WEIGHT_MIN, WEIGHT_MAX));
  }
  return result;
}

function loadLocal(): { series: SeriesThresholdMap; weights: WeightMap } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { series?: unknown; weights?: unknown };
    return { series: sanitizeThresholds(data.series), weights: sanitizeWeights(data.weights) };
  } catch {
    return null;
  }
}

let current = { series: defaults.series, weights: defaults.weights };

/** اعمال مقادیر روی داده‌ی سایت (سری‌ها و درس‌ها) */
export function applyScoring(map: { series: SeriesThresholdMap; weights: WeightMap }) {
  current = { series: map.series, weights: map.weights };
  for (const item of series) {
    const value = map.series[item.id];
    if (value) item.thresholds = { ...value };
  }
  for (const subject of subjects) {
    const value = map.weights[subject.id];
    if (value) subject.weight = value;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* بی‌اهمیت */
  }
  if (isServerOnline()) {
    void saveSettings({ seriesThresholds: current.series, subjectWeights: current.weights });
  }
}

export function getSeriesThresholds(): SeriesThresholdMap {
  return current.series;
}

export function getWeights(): WeightMap {
  return current.weights;
}

export const defaultSeriesThresholds = (): SeriesThresholdMap =>
  Object.fromEntries(series.map((item) => [item.id, { ...defaults.series[item.id] }]));

export const defaultWeights = (): WeightMap => ({ ...defaults.weights });

export function saveSeriesThresholds(map: SeriesThresholdMap) {
  applyScoring({ series: sanitizeThresholds(map), weights: current.weights });
  persist();
}

export function saveWeights(map: WeightMap) {
  applyScoring({ series: current.series, weights: sanitizeWeights(map) });
  persist();
}

export function resetSeriesThresholds(): SeriesThresholdMap {
  applyScoring({ series: defaultSeriesThresholds(), weights: current.weights });
  persist();
  return current.series;
}

export function resetWeights(): WeightMap {
  applyScoring({ series: current.series, weights: defaultWeights() });
  persist();
  return current.weights;
}

/** خواندن مقادیر ذخیره‌شده (قبل از رندر و بعد از ورود از سرور) */
export function initScoringLocal() {
  const local = loadLocal();
  if (local) applyScoring(local);
}

/* مقادیر ذخیره‌شده‌ی همین دستگاه، قبل از نمایش سایت اعمال می‌شوند */
initScoringLocal();

export async function initScoring() {
  if (!isServerOnline()) return;
  const settings = (await fetchSettings()) as
    | { seriesThresholds?: unknown; subjectWeights?: unknown }
    | null;
  if (!settings) return;
  if (settings.seriesThresholds || settings.subjectWeights) {
    applyScoring({
      series: sanitizeThresholds(settings.seriesThresholds),
      weights: sanitizeWeights(settings.subjectWeights),
    });
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* بی‌اهمیت */
    }
  } else {
    persist();
  }
}
