/**
 * لایه‌ی دیتابیس: یک فایل SQLite ساده.
 * کل داده‌ها در data/meftah.db است؛ کپی همین پوشه = انتقال کامل به VPS یا کامپیوتر مدرسه.
 */

import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const DATA_DIR = resolve(process.env.MEFTAH_DATA_DIR ?? 'data');
export const DB_PATH = join(DATA_DIR, 'meftah.db');
export const BACKUP_DIR = join(DATA_DIR, 'backups');

mkdirSync(BACKUP_DIR, { recursive: true });

export const db = new Database(DB_PATH, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    class_id TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    guardian TEXT NOT NULL DEFAULT '',
    ability REAL NOT NULL DEFAULT 14,
    trend REAL NOT NULL DEFAULT 0,
    maz INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT '',
    max_score REAL NOT NULL,
    round INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS scores (
    student_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    value REAL NOT NULL,
    PRIMARY KEY (student_id, exam_id, subject_id)
  );
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    category TEXT NOT NULL,
    kind TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    by_name TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL,
    note TEXT NOT NULL
  );
`);

export interface StudentRow {
  id: string;
  name: string;
  code: string;
  classId: string;
  phone: string;
  guardian: string;
  ability: number;
  trend: number;
  maz: boolean;
}

export interface ExamRow {
  id: string;
  seriesId: string;
  classId: string;
  title: string;
  date: string;
  kind: string;
  maxScore: number;
  round: number;
}

export interface ScoreRow {
  studentId: string;
  examId: string;
  subjectId: string;
  value: number;
}

export interface RecordRow {
  id: string;
  studentId: string;
  category: string;
  kind: string;
  date: string;
  text: string;
  by: string;
}

export interface DataPatch {
  students?: StudentRow[];
  exams?: ExamRow[];
  scores?: ScoreRow[];
  records?: RecordRow[];
  removedRecords?: string[];
}

const upsertStudent = db.prepare(`
  INSERT INTO students (id, name, code, class_id, phone, guardian, ability, trend, maz)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name, code = excluded.code, class_id = excluded.class_id,
    phone = excluded.phone, guardian = excluded.guardian, ability = excluded.ability,
    trend = excluded.trend, maz = excluded.maz
`);

const upsertExam = db.prepare(`
  INSERT INTO exams (id, series_id, class_id, title, date, kind, max_score, round)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    series_id = excluded.series_id, class_id = excluded.class_id, title = excluded.title,
    date = excluded.date, kind = excluded.kind, max_score = excluded.max_score, round = excluded.round
`);

const upsertScore = db.prepare(`
  INSERT INTO scores (student_id, exam_id, subject_id, value)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(student_id, exam_id, subject_id) DO UPDATE SET value = excluded.value
`);

const upsertRecord = db.prepare(`
  INSERT INTO records (id, student_id, category, kind, date, text, by_name)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    student_id = excluded.student_id, category = excluded.category, kind = excluded.kind,
    date = excluded.date, text = excluded.text, by_name = excluded.by_name
`);

export function bootstrap() {
  const students = db
    .query(
      'SELECT id, name, code, class_id AS classId, phone, guardian, ability, trend, maz FROM students ORDER BY class_id, name',
    )
    .all() as (Omit<StudentRow, 'maz'> & { maz: number })[];
  const exams = db
    .query(
      'SELECT id, series_id AS seriesId, class_id AS classId, title, date, kind, max_score AS maxScore, round FROM exams ORDER BY id',
    )
    .all() as ExamRow[];
  const scores = db
    .query('SELECT student_id AS studentId, exam_id AS examId, subject_id AS subjectId, value FROM scores')
    .all() as ScoreRow[];
  const records = db
    .query(
      'SELECT id, student_id AS studentId, category, kind, date, text, by_name AS "by" FROM records ORDER BY date DESC',
    )
    .all() as RecordRow[];

  return {
    students: students.map((student) => ({ ...student, maz: student.maz === 1 })),
    exams,
    scores,
    records,
  };
}

export function applyPatch(patch: DataPatch) {
  const counts = { students: 0, exams: 0, scores: 0, records: 0, removedRecords: 0 };
  db.transaction(() => {
    for (const student of patch.students ?? []) {
      upsertStudent.run(
        student.id,
        student.name,
        student.code,
        student.classId,
        student.phone ?? '',
        student.guardian ?? '',
        student.ability ?? 14,
        student.trend ?? 0,
        student.maz === false ? 0 : 1,
      );
      counts.students += 1;
    }
    for (const exam of patch.exams ?? []) {
      upsertExam.run(
        exam.id,
        exam.seriesId,
        exam.classId,
        exam.title,
        exam.date,
        exam.kind ?? '',
        exam.maxScore,
        exam.round ?? 1,
      );
      counts.exams += 1;
    }
    for (const score of patch.scores ?? []) {
      upsertScore.run(score.studentId, score.examId, score.subjectId, score.value);
      counts.scores += 1;
    }
    for (const record of patch.records ?? []) {
      upsertRecord.run(
        record.id,
        record.studentId,
        record.category,
        record.kind,
        record.date,
        record.text,
        record.by ?? '',
      );
      counts.records += 1;
    }
    for (const id of patch.removedRecords ?? []) {
      db.prepare('DELETE FROM records WHERE id = ?').run(id);
      counts.removedRecords += 1;
    }
    db.prepare('INSERT INTO log (at, note) VALUES (?, ?)').run(
      new Date().toISOString(),
      `patch: ${counts.students} دانش‌آموز، ${counts.scores} نمره، ${counts.records} گزارش`,
    );
  })();
  return counts;
}

/** پاک کردن کامل داده‌ی واقعی (کلاس/درس/سری در کد سایت است، نه اینجا) */
export function clearAll() {
  db.transaction(() => {
    db.exec('DELETE FROM scores; DELETE FROM exams; DELETE FROM records; DELETE FROM students;');
    db.prepare('INSERT INTO log (at, note) VALUES (?, ?)').run(new Date().toISOString(), 'clear all');
  })();
}

export function stats() {
  const one = (sql: string) => (db.query(sql).get() as { n: number }).n;
  return {
    students: one('SELECT COUNT(*) AS n FROM students'),
    exams: one('SELECT COUNT(*) AS n FROM exams'),
    scores: one('SELECT COUNT(*) AS n FROM scores'),
    records: one('SELECT COUNT(*) AS n FROM records'),
  };
}

/** ساخت نسخه‌ی پشتیبان با کپی امن فایل دیتابیس */
export function createBackup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const target = join(BACKUP_DIR, `meftah-${stamp}.db`);
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}';`);
  return target;
}
