import {
  classById,
  classes,
  examById,
  exams,
  scores,
  series,
  seriesById,
  studentById,
  students,
  subjectById,
  subjectsForClassSeries,
  type ExamSeries,
  type Score,
  type SeriesId,
} from '../data/mock';

/* ------------------------------------------------------------------ */
/* محاسبات — همه‌چیز همیشه با فیلتر «سری» انجام می‌شود                 */
/* ------------------------------------------------------------------ */

export function examPercentForStudent(studentId: string, examId: string): number | null {
  const exam = examById(examId);
  if (!exam) return null;
  const allowed = new Set(subjectsForClassSeries(exam.classId, exam.seriesId).map((s) => s.id));
  const rows = scores.filter(
    (s) => s.examId === examId && s.studentId === studentId && allowed.has(s.subjectId),
  );
  if (!rows.length) return null;
  let sum = 0;
  let weightSum = 0;
  for (const row of rows) {
    const subject = subjectById(row.subjectId);
    sum += row.value * subject.weight;
    weightSum += exam.maxScore * subject.weight;
  }
  return weightSum ? (sum / weightSum) * 100 : null;
}

export function examPercentForClass(examId: string): number {
  const exam = examById(examId);
  if (!exam) return 0;
  const values = students
    .filter((s) => s.classId === exam.classId)
    .map((s) => examPercentForStudent(s.id, examId))
    .filter((v): v is number => v !== null);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function examsForClassSeries(classId: string, seriesId: SeriesId) {
  return exams
    .filter((e) => e.classId === classId && e.seriesId === seriesId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface GrowthPoint {
  examId: string;
  title: string;
  date: string;
  percent: number;
  classPercent: number;
}

export function growthForStudent(studentId: string, seriesId: SeriesId): GrowthPoint[] {
  const student = studentById(studentId);
  if (!student) return [];
  return examsForClassSeries(student.classId, seriesId).map((exam) => ({
    examId: exam.id,
    title: exam.title,
    date: exam.date,
    percent: examPercentForStudent(studentId, exam.id) ?? 0,
    classPercent: examPercentForClass(exam.id),
  }));
}

/** درصد کلی دانش‌آموز در یک سری (میانگین وزنی همه‌ی آزمون‌ها) */
export function seriesPercentForStudent(studentId: string, seriesId: SeriesId): number | null {
  const student = studentById(studentId);
  if (!student) return null;
  const allowed = new Set(subjectsForClassSeries(student.classId, seriesId).map((s) => s.id));
  const rows = scores.filter((row) => {
    if (row.studentId !== studentId || !allowed.has(row.subjectId)) return false;
    const exam = examById(row.examId);
    return exam?.seriesId === seriesId && exam.classId === student.classId;
  });
  if (!rows.length) return null;
  let sum = 0;
  let weightSum = 0;
  for (const row of rows) {
    const exam = examById(row.examId)!;
    const subject = subjectById(row.subjectId);
    sum += (row.value / exam.maxScore) * 100 * subject.weight;
    weightSum += subject.weight;
  }
  return weightSum ? sum / weightSum : null;
}

export function seriesPercentForClass(classId: string, seriesId: SeriesId): number {
  const values = students
    .filter((s) => s.classId === classId)
    .map((s) => seriesPercentForStudent(s.id, seriesId))
    .filter((v): v is number => v !== null);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function seriesPercentForSchool(seriesId: SeriesId): number {
  const values = students
    .map((s) => seriesPercentForStudent(s.id, seriesId))
    .filter((v): v is number => v !== null);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export type LevelKey = 'strong' | 'good' | 'average' | 'needs';

export interface Level {
  key: LevelKey;
  label: string;
  tone: 'green' | 'blue' | 'amber' | 'red';
}

export function levelOf(percent: number | null, thresholds: ExamSeries['thresholds']): Level {
  if (percent === null) return { key: 'needs', label: 'بدون نمره', tone: 'gray' as never };
  if (percent >= thresholds.strong) return { key: 'strong', label: 'قوی', tone: 'green' };
  if (percent >= thresholds.good) return { key: 'good', label: 'خوب', tone: 'blue' };
  if (percent >= thresholds.pass) return { key: 'average', label: 'متوسط', tone: 'amber' };
  return { key: 'needs', label: 'نیازمند توجه', tone: 'red' };
}

/** سطح نسبت به کلاس: قوی‌تر از میانگین کلاس هم شرط است */
export function levelForStudentInSeries(studentId: string, seriesId: SeriesId): Level {
  const seriesItem = seriesById(seriesId);
  const student = studentById(studentId);
  if (!student) return { key: 'needs', label: '—', tone: 'red' };
  const own = seriesPercentForStudent(studentId, seriesId);
  const classAvg = seriesPercentForClass(student.classId, seriesId);
  const level = levelOf(own, seriesItem.thresholds);
  if (level.key === 'strong' && own !== null && own < classAvg) {
    return { key: 'good', label: 'خوب', tone: 'blue' };
  }
  return level;
}

export function rankInExam(studentId: string, examId: string): { rank: number; total: number } {
  const exam = examById(examId);
  if (!exam) return { rank: 0, total: 0 };
  const list = students
    .filter((s) => s.classId === exam.classId)
    .map((s) => ({ id: s.id, percent: examPercentForStudent(s.id, examId) ?? 0 }))
    .sort((a, b) => b.percent - a.percent);
  const index = list.findIndex((row) => row.id === studentId);
  return { rank: index >= 0 ? index + 1 : 0, total: list.length };
}

export interface SubjectPercent {
  subjectId: string;
  name: string;
  percent: number;
  classPercent: number;
  weight: number;
}

export function subjectPercents(studentId: string, seriesId: SeriesId): SubjectPercent[] {
  const student = studentById(studentId);
  if (!student) return [];
  return subjectsForClassSeries(student.classId, seriesId).map((subject) => {
    let sum = 0;
    let weight = 0;
    let classSum = 0;
    let classWeight = 0;

    for (const exam of examsForClassSeries(student.classId, seriesId)) {
      const row = scores.find(
        (s) => s.studentId === studentId && s.examId === exam.id && s.subjectId === subject.id,
      );
      if (row) {
        sum += (row.value / exam.maxScore) * 100 * subject.weight;
        weight += subject.weight;
      }
      for (const classmate of students.filter((s) => s.classId === student.classId)) {
        const mateRow = scores.find(
          (s) => s.studentId === classmate.id && s.examId === exam.id && s.subjectId === subject.id,
        );
        if (mateRow) {
          classSum += (mateRow.value / exam.maxScore) * 100 * subject.weight;
          classWeight += subject.weight;
        }
      }
    }

    return {
      subjectId: subject.id,
      name: subject.name,
      percent: weight ? sum / weight : 0,
      classPercent: classWeight ? classSum / classWeight : 0,
      weight: subject.weight,
    };
  });
}

export function subjectPercentForClass(classId: string, subjectId: string, seriesId: SeriesId): number {
  const studentList = students.filter((s) => s.classId === classId);
  const values = studentList.map((s) => {
    const own = subjectPercents(s.id, seriesId).find((p) => p.subjectId === subjectId);
    return own?.percent ?? 0;
  });
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* ------------------------- dashboard helpers ---------------------- */

export function classComparison(seriesId: SeriesId) {
  return classes.map((cls) => ({
    name: cls.name,
    percent: Number(seriesPercentForClass(cls.id, seriesId).toFixed(1)),
  }));
}

export function seriesTrend(seriesId: SeriesId, classId?: string) {
  const list = exams.filter((e) => e.seriesId === seriesId && (!classId || e.classId === classId));
  const maxRound = list.reduce((max, e) => Math.max(max, e.round), 0);
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  return rounds.map((round) => {
    const roundExams = list.filter((e) => e.round === round);
    const values = roundExams.map((exam) => examPercentForClass(exam.id));
    return {
      name: `دور ${round}`,
      percent: Number((values.reduce((a, b) => a + b, 0) / (values.length || 1)).toFixed(1)),
    };
  });
}

export function needsAttention(limit = 5, classId?: string) {
  const rows = students
    .filter((student) => !classId || student.classId === classId)
    .map((student) => {
      const own = seriesPercentForStudent(student.id, 'ghalamchi');
      const level = levelForStudentInSeries(student.id, 'ghalamchi');
      return { student, percent: own, level };
    })
    .filter((row) => row.level.key === 'needs')
    .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));
  return rows.slice(0, limit);
}

export function studentLabel(studentId: string) {
  const student = studentById(studentId);
  if (!student) return { name: '—', className: '—' };
  return { name: student.name, className: classById(student.classId).name };
}

/* ---------------------- نمره‌ای در برابر درصدی --------------------- */

function weightedRaw(rows: Score[], maxScore: number): number {
  let sum = 0;
  let weightSum = 0;
  for (const row of rows) {
    const subject = subjectById(row.subjectId);
    sum += row.value * subject.weight;
    weightSum += maxScore * subject.weight;
  }
  // خروجی نمره‌ی خام است (از maxScore)، نه نسبت
  return weightSum ? (sum / weightSum) * maxScore : 0;
}

/** میانگین وزنی نمره‌ی خام دانش‌آموز در یک آزمون (از maxScore) */
export function examRawForStudent(studentId: string, examId: string): number | null {
  const exam = examById(examId);
  if (!exam) return null;
  const rows = scores.filter((s) => s.examId === examId && s.studentId === studentId);
  if (!rows.length) return null;
  return weightedRaw(rows, exam.maxScore);
}

function rawValuesForClass(examId: string): number[] {
  const exam = examById(examId);
  if (!exam) return [];
  return students
    .filter((s) => s.classId === exam.classId)
    .map((s) => examRawForStudent(s.id, examId))
    .filter((v): v is number => v !== null);
}

export function examRawForClass(examId: string): number {
  const values = rawValuesForClass(examId);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** نمره‌ی خام همان دور، در همه‌ی کلاس‌های مدرسه */
export function examRawForSchool(examId: string): number {
  const exam = examById(examId);
  if (!exam) return 0;
  const values = exams
    .filter((e) => e.seriesId === exam.seriesId && e.round === exam.round)
    .flatMap((e) => rawValuesForClass(e.id));
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** درصد همان دور، در همه‌ی کلاس‌های مدرسه */
export function examPercentForSchool(examId: string): number {
  const exam = examById(examId);
  if (!exam) return 0;
  const values = exams
    .filter((e) => e.seriesId === exam.seriesId && e.round === exam.round)
    .flatMap((e) =>
      students
        .filter((s) => s.classId === e.classId)
        .map((s) => examPercentForStudent(s.id, e.id))
        .filter((v): v is number => v !== null),
    );
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** میانگین نمره‌ی خام دانش‌آموز در یک سری نمره‌ای (از ۲۰) */
export function seriesScoreForStudent(studentId: string, seriesId: SeriesId): number | null {
  const student = studentById(studentId);
  if (!student) return null;
  const values = examsForClassSeries(student.classId, seriesId)
    .map((exam) => examRawForStudent(studentId, exam.id))
    .filter((v): v is number => v !== null);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function seriesScoreForClass(classId: string, seriesId: SeriesId): number {
  const values = students
    .filter((s) => s.classId === classId)
    .map((s) => seriesScoreForStudent(s.id, seriesId))
    .filter((v): v is number => v !== null);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function seriesScoreForSchool(seriesId: SeriesId): number {
  const values = students
    .map((s) => seriesScoreForStudent(s.id, seriesId))
    .filter((v): v is number => v !== null);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** میانگین همه‌ی سری‌های نمره‌ای برای یک دانش‌آموز */
export function scoreAverageForStudent(studentId: string): number | null {
  const values = series
    .filter((s) => s.kind === 'score')
    .map((s) => seriesScoreForStudent(studentId, s.id))
    .filter((v): v is number => v !== null);
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** میانگین نمره‌ای مدرسه، برای کارت داشبورد */
export function scoreAverageForSchool(): number {
  const values = series
    .filter((s) => s.kind === 'score')
    .map((s) => seriesScoreForSchool(s.id))
    .filter((v) => v > 0);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface PercentPoint {
  examId: string;
  seriesId: SeriesId;
  seriesShort: string;
  round: number;
  title: string;
  percent: number;
  classPercent: number;
  schoolPercent: number;
}

export interface ScorePoint {
  examId: string;
  seriesId: SeriesId;
  seriesShort: string;
  round: number;
  title: string;
  value: number;
  maxScore: number;
  classValue: number;
  schoolValue: number;
}

/** همه‌ی آزمون‌های درصدی دانش‌آموز به ترتیب تاریخ */
export function percentPointsForStudent(studentId: string): PercentPoint[] {
  const student = studentById(studentId);
  if (!student) return [];
  const points: PercentPoint[] = [];
  for (const s of series.filter((item) => item.kind === 'percent')) {
    for (const exam of examsForClassSeries(student.classId, s.id)) {
      const percent = examPercentForStudent(studentId, exam.id);
      if (percent === null) continue;
      points.push({
        examId: exam.id,
        seriesId: s.id,
        seriesShort: s.short,
        round: exam.round,
        title: exam.title,
        percent,
        classPercent: examPercentForClass(exam.id),
        schoolPercent: examPercentForSchool(exam.id),
      });
    }
  }
  return points;
}

/** همه‌ی آزمون‌های نمره‌ای دانش‌آموز به ترتیب تاریخ */
export function scorePointsForStudent(studentId: string): ScorePoint[] {
  const student = studentById(studentId);
  if (!student) return [];
  const points: ScorePoint[] = [];
  for (const s of series.filter((item) => item.kind === 'score')) {
    for (const exam of examsForClassSeries(student.classId, s.id)) {
      const value = examRawForStudent(studentId, exam.id);
      if (value === null) continue;
      points.push({
        examId: exam.id,
        seriesId: s.id,
        seriesShort: s.short,
        round: exam.round,
        title: exam.title,
        value,
        maxScore: exam.maxScore,
        classValue: examRawForClass(exam.id),
        schoolValue: examRawForSchool(exam.id),
      });
    }
  }
  return points;
}

export const allSeries = series;

/* ---------------- مقایسه روی یک مقیاس مشترک ---------------- */

/** حداکثر مقیاس سری: ۱۰۰ برای درصدی‌ها، ۲۰ برای نمره‌ای‌ها */
export function scaleOf(seriesId: SeriesId): number {
  const item = seriesById(seriesId);
  return item.kind === 'percent' ? 100 : item.maxScore;
}

/** مقدار مقایسه‌ای یک درصد (۰ تا ۱۰۰) روی مقیاس همان سری */
export function toScale(percent: number, seriesId: SeriesId): number {
  return (percent / 100) * scaleOf(seriesId);
}

export function seriesValueForStudent(studentId: string, seriesId: SeriesId): number | null {
  return seriesById(seriesId).kind === 'percent'
    ? seriesPercentForStudent(studentId, seriesId)
    : seriesScoreForStudent(studentId, seriesId);
}

export function seriesValueForClass(classId: string, seriesId: SeriesId): number {
  return seriesById(seriesId).kind === 'percent'
    ? seriesPercentForClass(classId, seriesId)
    : seriesScoreForClass(classId, seriesId);
}

export function seriesValueForSchool(seriesId: SeriesId): number {
  return seriesById(seriesId).kind === 'percent'
    ? seriesPercentForSchool(seriesId)
    : seriesScoreForSchool(seriesId);
}
