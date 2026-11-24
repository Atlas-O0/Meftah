/**
 * ذخیره‌ی دستی نمره‌های یک آزمون.
 * همان قاعده‌ی اکسل: کلید (دانش‌آموز + آزمون + درس) و به‌روزرسانی جای تکرار.
 */

import { exams, scores, subjectsForClassSeries, type Score } from '../data/mock';
import { parseNumber } from './excel';
import { appendSavedImports } from './persist';

export interface SaveScoresResult {
  written: number;
  empty: number;
  invalid: number;
  values: Record<string, number>;
}

export function saveExamScores(examId: string, entries: Record<string, string>): SaveScoresResult {
  const exam = exams.find((item) => item.id === examId);
  const result: SaveScoresResult = { written: 0, empty: 0, invalid: 0, values: {} };
  if (!exam) return result;

  const allowed = new Set(subjectsForClassSeries(exam.classId, exam.seriesId).map((subject) => subject.id));
  const saved: Score[] = [];

  for (const [key, raw] of Object.entries(entries)) {
    const [studentId, subjectId] = key.split(':');
    if (!studentId || !subjectId || !allowed.has(subjectId)) continue;

    const text = String(raw ?? '').trim();
    if (text === '') {
      result.empty += 1;
      continue;
    }
    const value = parseNumber(text);
    if (value === null || value < 0 || value > exam.maxScore) {
      result.invalid += 1;
      continue;
    }

    const existing = scores.find(
      (score) => score.studentId === studentId && score.examId === examId && score.subjectId === subjectId,
    );
    if (existing) {
      existing.value = value;
      saved.push({ ...existing });
    } else {
      const score: Score = { studentId, examId, subjectId, value };
      scores.push(score);
      saved.push(score);
    }
    result.written += 1;
    result.values[key] = value;
  }

  if (saved.length > 0) appendSavedImports({ students: [], exams: [], scores: saved });
  return result;
}
