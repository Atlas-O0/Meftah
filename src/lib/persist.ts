/**
 * ذخیره‌ی داده‌های واردشده از اکسل در همین مرورگر.
 * تا وقتی سرور/SQLite راه نیفتاده، آپلودها با رفرش پاک نشوند.
 */

import type { Exam, Score, Student } from '../data/mock';
import { pushClear, pushPatch } from './api';

const KEY = 'meftah-excel-imports-v1';

export interface SavedImports {
  students: Student[];
  exams: Exam[];
  scores: Score[];
}

export function loadSavedImports(): SavedImports | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedImports;
    if (!data || !Array.isArray(data.students) || !Array.isArray(data.exams) || !Array.isArray(data.scores)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function appendSavedImports(patch: SavedImports) {
  const current = loadSavedImports() ?? { students: [], exams: [], scores: [] };
  const scoreKey = (score: { studentId: string; examId: string; subjectId: string }) =>
    `${score.studentId}|${score.examId}|${score.subjectId}`;
  const mergedScores = new Map(current.scores.map((score) => [scoreKey(score), score]));
  for (const score of patch.scores) mergedScores.set(scoreKey(score), score);

  const next: SavedImports = {
    students: [...current.students, ...patch.students],
    exams: [...current.exams, ...patch.exams],
    scores: [...mergedScores.values()],
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* اگر حافظه پر بود، فقط همین نشست کار می‌کند */
  }

  /* اگر سرور بالاست، همان لحظه در SQLite هم ذخیره می‌شود */
  void pushPatch(patch);
}

export function clearSavedImports() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* بی‌اهمیت */
  }
  void pushClear();
}
