/**
 * موتور تطبیق سطرهای اکسل با پروفایل‌ها و ثبت نمره‌ها.
 *
 * قاعده: اول کد دانش‌آموزی، بعد نام کامل در همان کلاس، بعد نام در کل مدرسه.
 * هر سطری که پروفایل ندارد «دانش‌آموز جدید» است و بعد از تأیید ساخته می‌شود.
 * ثبت نمره با کلید (دانش‌آموز + آزمون + درس) است؛ آپلود دوباره رکورد تکراری نمی‌سازد.
 */

import {
  exams,
  scores,
  seriesById,
  students,
  subjectsForClassSeries,
  type Exam,
  type Score,
  type SeriesId,
  type Student,
} from '../data/mock';
import { normKey, parseCode, resolveClassId, subjectNameById, type RawRow } from './excel';
import { appendSavedImports } from './persist';

export type DraftStatus = 'found' | 'new' | 'ambiguous' | 'other' | 'invalid';

export interface DraftRow {
  key: string;
  source: string;
  name: string;
  code: string;
  classId: string;
  status: DraftStatus;
  note: string;
  /** گزینه‌ها برای انتخاب دستی (وقتی نام تکراری است) */
  candidates: string[];
  /** دانش‌آموز موجودِ انتخاب‌شده؛ برای «جدید» خالی است */
  chosenId: string;
  values: Record<string, number | null>;
  issues: string[];
}

export const statusLabel: Record<DraftStatus, string> = {
  found: 'پیدا شد',
  new: 'پروفایل جدید',
  ambiguous: 'نیازمند انتخاب',
  other: 'کلاس دیگر',
  invalid: 'ثبت نمی‌شود',
};

export const statusTone: Record<DraftStatus, 'green' | 'blue' | 'amber' | 'gray' | 'red'> = {
  found: 'green',
  new: 'blue',
  ambiguous: 'amber',
  other: 'amber',
  invalid: 'red',
};

const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

/** سطرهای خام اکسل → سطرهای بازبینی */
export function matchRows(rawRows: RawRow[], seriesId: SeriesId, fallbackClassId: string): DraftRow[] {
  const series = seriesById(seriesId);
  return rawRows.map((raw, index) => {
    const classId = resolveClassId(raw.classHint) ?? fallbackClassId;
    const issues: string[] = [];
    const values: Record<string, number | null> = {};

    if (classId) {
      const allowed = new Set(subjectsForClassSeries(classId, seriesId).map((s) => s.id));
      for (const [subjectId, value] of Object.entries(raw.values)) {
        if (!allowed.has(subjectId)) {
          issues.push(
            series.kind === 'percent'
              ? `درس عمومی «${subjectNameById(subjectId)}» در آزمون تستی ثبت نمی‌شود`
              : `درس «${subjectNameById(subjectId)}» برای این کلاس نیست`,
          );
          continue;
        }
        if (series.kind === 'percent' && (value < 0 || value > 100)) {
          issues.push(`${subjectNameById(subjectId)}: ${value} خارج از ۰ تا ۱۰۰`);
          values[subjectId] = null;
          continue;
        }
        if (series.kind === 'score' && (value < 0 || value > series.maxScore)) {
          issues.push(`${subjectNameById(subjectId)}: ${value} خارج از ۰ تا ${series.maxScore}`);
          values[subjectId] = null;
          continue;
        }
        values[subjectId] = value;
      }
    }

    const base: DraftRow = {
      key: `${raw.sheet}-${raw.rowNumber}-${index}`,
      source: `${raw.sheet} · سطر ${raw.rowNumber}`,
      name: raw.name,
      code: raw.code,
      classId: classId ?? '',
      status: 'new',
      note: '',
      candidates: [],
      chosenId: '',
      values,
      issues,
    };

    if (!classId) {
      return { ...base, status: 'invalid', note: 'کلاس این سطر مشخص نشد' };
    }

    const code = parseCode(raw.code);
    if (code) {
      const byCode = students.find((student) => parseCode(student.code) === code);
      if (byCode) {
        const sameName = normKey(byCode.name) === normKey(raw.name);
        return {
          ...base,
          status: 'found',
          chosenId: byCode.id,
          classId: byCode.classId,
          note: sameName ? 'با کد دانش‌آموزی' : `کد مال «${byCode.name}» است`,
        };
      }
    }

    const nameKey = normKey(raw.name);
    if (!nameKey) {
      return { ...base, status: 'invalid', note: 'نام و کد خالی است' };
    }

    const inClass = students.filter((student) => student.classId === classId && normKey(student.name) === nameKey);
    if (inClass.length === 1) {
      return { ...base, status: 'found', chosenId: inClass[0].id, note: 'با نام و کلاس' };
    }
    if (inClass.length > 1) {
      return {
        ...base,
        status: 'ambiguous',
        candidates: inClass.map((student) => student.id),
        chosenId: inClass[0].id,
        note: 'چند دانش‌آموز با این نام در کلاس هست',
      };
    }

    const elsewhere = students.filter((student) => normKey(student.name) === nameKey);
    if (elsewhere.length === 1) {
      return {
        ...base,
        status: 'other',
        chosenId: elsewhere[0].id,
        classId: elsewhere[0].classId,
        note: `در کلاس دیگری است (${elsewhere[0].classId}) — پس از تأیید به همین کلاس منتقل می‌شود`,
      };
    }
    if (elsewhere.length > 1) {
      return {
        ...base,
        status: 'ambiguous',
        candidates: elsewhere.map((student) => student.id),
        chosenId: elsewhere[0].id,
        note: 'نام تکراری در مدرسه',
      };
    }

    return { ...base, status: 'new', note: raw.code ? 'کد تازه — پروفایل ساخته می‌شود' : 'پروفایل ساخته می‌شود' };
  });
}

export interface ApplyInput {
  seriesId: SeriesId;
  title: string;
  date: string;
  drafts: DraftRow[];
}

export interface ApplyResult {
  rows: number;
  newStudents: number;
  updatedStudents: number;
  exams: number;
  scores: number;
  skipped: number;
}

/** ثبت واقعی: ساخت پروفایل‌های تازه، ساخت آزمون هر کلاس و نوشتن نمره‌ها */
export function applyImport({ seriesId, title, date, drafts }: ApplyInput): ApplyResult {
  const series = seriesById(seriesId);
  const stamp = Date.now();
  const createdStudents: Student[] = [];
  const createdExams: Exam[] = [];
  const createdScores: Score[] = [];
  const examByClass = new Map<string, Exam>();
  const usedCodes = new Set(students.map((student) => parseCode(student.code)));
  let nextNumber = students.length + 1;
  let applied = 0;
  let updatedStudents = 0;
  let skipped = 0;

  for (const draft of drafts) {
    if (draft.status === 'invalid') {
      skipped += 1;
      continue;
    }
    if (draft.status === 'ambiguous' && !draft.chosenId) {
      skipped += 1;
      continue;
    }
    if (!draft.classId) {
      skipped += 1;
      continue;
    }

    let studentId = draft.chosenId;
    if (!studentId) {
      /* همین نام ممکن است در شیت دیگری از همین فایل آمده باشد؛ پروفایل تکراری ساخته نشود */
      const nameKey = normKey(draft.name);
      const sameName = nameKey
        ? students.find((item) => item.classId === draft.classId && normKey(item.name) === nameKey)
        : undefined;
      if (sameName) {
        studentId = sameName.id;
      } else {
        let code = parseCode(draft.code);
        if (!code || usedCodes.has(code)) {
          do {
            code = String(900000 + nextNumber);
            nextNumber += 1;
          } while (usedCodes.has(code));
        }
        usedCodes.add(code);
        const student: Student = {
          id: `nx-${stamp}-${createdStudents.length + 1}`,
          name: draft.name || `دانش‌آموز ${code}`,
          code,
          classId: draft.classId,
          phone: '',
          guardian: '',
          ability: 0.75,
          trend: 0,
          maz: true,
        };
        students.push(student);
        createdStudents.push(student);
        studentId = student.id;
      }
    } else if (draft.status === 'other') {
      const student = students.find((item) => item.id === studentId);
      if (student && student.classId !== draft.classId) {
        student.classId = draft.classId;
        updatedStudents += 1;
      }
    }

    /* فایلی که فقط فهرست نام دارد نمره‌ای ندارد؛ پروفایل ساخته می‌شود ولی آزمون خالی ثبت نمی‌شود */
    const scoreEntries = Object.entries(draft.values).filter(
      ([, value]) => value !== null && value !== undefined,
    ) as Array<[string, number]>;
    if (scoreEntries.length === 0) {
      applied += 1;
      continue;
    }

    const examTitle = title.trim() || `${series.name} — ${date}`;
    let exam = examByClass.get(draft.classId);
    if (!exam) {
      // اگر همین آزمون قبلاً ساخته شده، دوباره ساخته نمی‌شود؛ نمره‌ها به‌روز می‌شوند
      const existingExam = exams.find(
        (item) =>
          item.seriesId === seriesId && item.classId === draft.classId && item.title === examTitle && item.date === date,
      );
      if (existingExam) {
        exam = existingExam;
      } else {
        exam = {
          id: `imp-${stamp}-${draft.classId}`,
          seriesId,
          classId: draft.classId,
          title: examTitle,
          date,
          kind: 'آپلود اکسل',
          maxScore: series.maxScore,
          round: 1,
        };
        exams.push(exam);
        createdExams.push(exam);
      }
      examByClass.set(draft.classId, exam);
    }

    for (const [subjectId, value] of scoreEntries) {
      const existing = scores.find(
        (score) => score.studentId === studentId && score.examId === exam.id && score.subjectId === subjectId,
      );
      if (existing) {
        existing.value = value;
        createdScores.push({ ...existing });
      } else {
        const score: Score = { studentId, examId: exam.id, subjectId, value };
        scores.push(score);
        createdScores.push(score);
      }
    }
    applied += 1;
  }

  if (createdStudents.length || createdExams.length || createdScores.length) {
    appendSavedImports({ students: createdStudents, exams: createdExams, scores: createdScores });
  }

  return {
    rows: applied,
    newStudents: createdStudents.length,
    updatedStudents,
    exams: createdExams.length,
    scores: createdScores.length,
    skipped,
  };
}

/** برای نمایش گزینه‌های انتخاب دستی */
export const candidateLabel = (id: string) => {
  const student = students.find((item) => item.id === id);
  return student ? `${student.name} — ${student.code}` : studentName(id);
};
