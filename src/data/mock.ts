/**
 * داده‌ی نمونه برای نسخه‌ی نمایشی.
 * هیچ ذخیره‌سازی‌ای وجود ندارد؛ همه‌چیز در همین فایل ساخته می‌شود.
 * ساختار عیناً همان چیزی است که بعداً به جدول‌های SQLite وصل می‌شود.
 */

import { loadSavedImports } from '../lib/persist';
import { getDataMode } from '../lib/mode';

export type SeriesId =
  | 'ghalamchi'
  | 'capsule'
  | 'mostamar1'
  | 'nobat1'
  | 'mostamar2'
  | 'nobat2'
  | 'maz'
  | 'moshavere';

/** درصدی = از ۱۰۰ ، نمره‌ای = از ۲۰ */
export type SeriesKind = 'percent' | 'score';

export interface ExamSeries {
  id: SeriesId;
  name: string;
  short: string;
  color: string;
  maxScore: number;
  kind: SeriesKind;
  /** بعضی دانش‌آموزها این سری را ندارند (مثل ماز) */
  optional: boolean;
  hasTemplate: boolean;
  templateNote: string;
  thresholds: { strong: number; good: number; pass: number };
}

/** رشته‌های پایه دوازدهم */
export type TrackId = 'math' | 'science';

export const trackLabels: Record<TrackId, string> = {
  math: 'ریاضی فیزیک',
  science: 'علوم تجربی',
};

export const trackShortLabels: Record<TrackId, string> = {
  math: 'ریاضی',
  science: 'تجربی',
};

export type SubjectTrack = 'common' | TrackId;

export const subjectTrackLabels: Record<SubjectTrack, string> = {
  common: 'مشترک',
  math: 'ویژه ریاضی فیزیک',
  science: 'ویژه تجربی',
};

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  track: TrackId;
  teacher: string;
}

export interface Subject {
  id: string;
  name: string;
  weight: number;
  difficulty: number;
  track: SubjectTrack;
  /** درس عمومی (فارسی، عربی، دینی…) — آزمون‌های تستی این‌ها را ندارند */
  general?: boolean;
}

export interface Student {
  id: string;
  name: string;
  code: string;
  classId: string;
  phone: string;
  guardian: string;
  ability: number;
  trend: number;
  /** آزمون ماز را دارد یا نه */
  maz: boolean;
}

export interface Exam {
  id: string;
  seriesId: SeriesId;
  classId: string;
  title: string;
  date: string;
  kind: string;
  maxScore: number;
  round: number;
}

export interface Score {
  studentId: string;
  examId: string;
  subjectId: string;
  value: number;
}

export type RecordCategory = 'انضباطی' | 'فرهنگی' | 'پژوهشی' | 'ورزشی';
export type RecordKind = 'تشویق' | 'فعالیت' | 'تذکر' | 'غیبت' | 'مشاوره';

export const recordCategories: RecordCategory[] = ['انضباطی', 'فرهنگی', 'پژوهشی', 'ورزشی'];
export const recordKinds: RecordKind[] = ['تشویق', 'فعالیت', 'تذکر', 'غیبت', 'مشاوره'];

export interface StudentRecord {
  id: string;
  studentId: string;
  category: RecordCategory;
  kind: RecordKind;
  date: string;
  text: string;
  by: string;
}

export interface ImportRecord {
  id: string;
  fileName: string;
  seriesId: SeriesId;
  method: 'PDF متنی' | 'عکس (OCR)' | 'ورود دستی' | 'اکسل';
  rows: number;
  date: string;
  status: 'ثبت شد' | 'نیازمند بازبینی';
  by: string;
}

/* ------------------------------------------------------------------ */

const t = { strong: 85, good: 70, pass: 50 };

export const series: ExamSeries[] = [
  {
    id: 'ghalamchi',
    name: 'قلمچی',
    short: 'قلمچی',
    color: '#4c6ef5',
    maxScore: 100,
    kind: 'percent',
    optional: false,
    hasTemplate: true,
    templateNote: 'درصدی — یک ستون برای هر درس رشته',
    thresholds: { ...t },
  },
  {
    id: 'capsule',
    name: 'کپسول نهایی',
    short: 'کپسول',
    color: '#0ca678',
    maxScore: 20,
    kind: 'score',
    optional: false,
    hasTemplate: false,
    templateNote: 'نمره‌ای از ۲۰ — قالب PDF ساخته نشده',
    thresholds: { ...t },
  },
  {
    id: 'mostamar1',
    name: 'مستمر اول',
    short: 'مستمر اول',
    color: '#f59f00',
    maxScore: 20,
    kind: 'score',
    optional: false,
    hasTemplate: false,
    templateNote: 'نمره‌ای از ۲۰ — قالب PDF ساخته نشده',
    thresholds: { ...t },
  },
  {
    id: 'nobat1',
    name: 'نوبت اول',
    short: 'نوبت اول',
    color: '#e8590c',
    maxScore: 20,
    kind: 'score',
    optional: false,
    hasTemplate: false,
    templateNote: 'نمره‌ای از ۲۰ — قالب PDF ساخته نشده',
    thresholds: { ...t },
  },
  {
    id: 'mostamar2',
    name: 'مستمر دوم',
    short: 'مستمر دوم',
    color: '#12b886',
    maxScore: 20,
    kind: 'score',
    optional: false,
    hasTemplate: false,
    templateNote: 'نمره‌ای از ۲۰ — قالب PDF ساخته نشده',
    thresholds: { ...t },
  },
  {
    id: 'nobat2',
    name: 'نوبت دوم',
    short: 'نوبت دوم',
    color: '#d6336c',
    maxScore: 20,
    kind: 'score',
    optional: false,
    hasTemplate: false,
    templateNote: 'نمره‌ای از ۲۰ — قالب PDF ساخته نشده',
    thresholds: { ...t },
  },
  {
    id: 'maz',
    name: 'ماز',
    short: 'ماز',
    color: '#7048e8',
    maxScore: 100,
    kind: 'percent',
    optional: true,
    hasTemplate: true,
    templateNote: 'درصدی — اختیاری، همه‌ی دانش‌آموزها ندارند',
    thresholds: { ...t },
  },
  {
    id: 'moshavere',
    name: 'آزمون مشاوره',
    short: 'مشاوره',
    color: '#1c7ed6',
    maxScore: 100,
    kind: 'percent',
    optional: false,
    hasTemplate: false,
    templateNote: 'درصدی — آزمون‌های مشاوره‌ای',
    thresholds: { ...t },
  },
];

/** دو خانواده‌ی جدا: تشریحی (نمره‌ای) و تستی (درصدی) */
export const seriesGroups: Array<{ title: string; short: string; note: string; ids: SeriesId[] }> = [
  {
    title: 'آزمون‌های تشریحی',
    short: 'تشریحی',
    note: 'نمره‌ای از ۲۰ — مستمر ۱، نوبت اول، مستمر ۲، نوبت دوم، کپسول نهایی',
    ids: ['mostamar1', 'nobat1', 'mostamar2', 'nobat2', 'capsule'],
  },
  {
    title: 'آزمون‌های تستی',
    short: 'تستی',
    note: 'درصدی از ۱۰۰ — قلمچی، ماز و آزمون‌های مشاوره',
    ids: ['ghalamchi', 'maz', 'moshavere'],
  },
];

/** سری‌ها به ترتیب گروه‌ها (برای تب‌ها و فهرست‌ها) */
export const orderedSeries: ExamSeries[] = seriesGroups.flatMap((group) =>
  group.ids.map((id) => series.find((s) => s.id === id)!),
);

export const classes: ClassRoom[] = [
  // پایه دوازدهم — ۱۲۱ تا ۱۲۳ ریاضی فیزیک
  { id: 'c121', name: '۱۲۱', grade: 'دوازدهم', track: 'math', teacher: 'خانم موسوی' },
  { id: 'c122', name: '۱۲۲', grade: 'دوازدهم', track: 'math', teacher: 'خانم موسوی' },
  { id: 'c123', name: '۱۲۳', grade: 'دوازدهم', track: 'math', teacher: 'آقای رستمی' },
  // پایه دوازدهم — ۱۲۴ تا ۱۲۶ علوم تجربی
  { id: 'c124', name: '۱۲۴', grade: 'دوازدهم', track: 'science', teacher: 'آقای رستمی' },
  { id: 'c125', name: '۱۲۵', grade: 'دوازدهم', track: 'science', teacher: 'خانم کاظمی' },
  { id: 'c126', name: '۱۲۶', grade: 'دوازدهم', track: 'science', teacher: 'خانم کاظمی' },
];

/**
 * درس‌های پایه دوازدهم — مشترک، ویژه‌ی ریاضی فیزیک و ویژه‌ی تجربی.
 * هر درس با کلید یکتا ذخیره می‌شود؛ دروس مشترک برای هر دو رشته‌اند.
 */
export const subjects: Subject[] = [
  // دروس مشترک
  { id: 'literature', name: 'فارسی ۳', weight: 4, difficulty: 0.97, track: 'common', general: true },
  { id: 'writing', name: 'نگارش ۳', weight: 2, difficulty: 1.0, track: 'common', general: true },
  { id: 'arabic', name: 'عربی، زبان قرآن ۳', weight: 2, difficulty: 0.94, track: 'common', general: true },
  { id: 'religion', name: 'دین و زندگی ۳', weight: 2, difficulty: 1.02, track: 'common', general: true },
  { id: 'english', name: 'زبان خارجی ۳', weight: 2, difficulty: 0.95, track: 'common', general: true },
  { id: 'health', name: 'سلامت و بهداشت', weight: 2, difficulty: 1.05, track: 'common', general: true },
  { id: 'identity', name: 'هویت اجتماعی', weight: 2, difficulty: 1.0, track: 'common', general: true },
  { id: 'family', name: 'مدیریت خانواده و سبک زندگی', weight: 2, difficulty: 1.04, track: 'common', general: true },
  // دروس ویژه‌ی ریاضی فیزیک
  { id: 'calculus', name: 'حسابان ۲', weight: 4, difficulty: 0.87, track: 'math' },
  { id: 'geometry', name: 'هندسه ۳', weight: 3, difficulty: 0.9, track: 'math' },
  { id: 'discrete', name: 'ریاضیات گسسته', weight: 3, difficulty: 0.92, track: 'math' },
  // دروس ویژه‌ی علوم تجربی
  { id: 'math', name: 'ریاضی ۳', weight: 4, difficulty: 0.88, track: 'science' },
  { id: 'biology', name: 'زیست‌شناسی ۳', weight: 4, difficulty: 0.93, track: 'science' },
  // فیزیک و شیمی در هر دو رشته تدریس می‌شوند، با یک کلید مشترک
  { id: 'physics', name: 'فیزیک ۳', weight: 4, difficulty: 0.86, track: 'common' },
  { id: 'chemistry', name: 'شیمی ۳', weight: 4, difficulty: 0.9, track: 'common' },
];

function trackSubjects(track: TrackId): Subject[] {
  return subjects.filter((s) => s.track === 'common' || s.track === track);
}

/** دروس یک رشته (مشترک + اختصاصی همان رشته) */
export function subjectsForTrack(track: TrackId): Subject[] {
  return trackSubjects(track);
}

/** دروس یک کلاس بر اساس رشته‌ی آن */
export function subjectsForClass(classId: string): Subject[] {
  const cls = classes.find((c) => c.id === classId);
  return cls ? trackSubjects(cls.track) : subjects;
}

/** دروس یک دانش‌آموز بر اساس کلاسش */
export function subjectsForStudent(studentId: string): Subject[] {
  const student = students.find((s) => s.id === studentId);
  return student ? subjectsForClass(student.classId) : subjects;
}

/**
 * دروس یک کلاس در یک سری.
 * آزمون‌های تستی (قلمچی، ماز، مشاوره) درس عمومی ندارند؛ فقط اختصاصی‌های رشته.
 */
export function subjectsForClassSeries(classId: string, seriesId: SeriesId): Subject[] {
  const list = subjectsForClass(classId);
  const item = series.find((s) => s.id === seriesId);
  return item && item.kind === 'percent' ? list.filter((subject) => !subject.general) : list;
}

/** دروس مشترک چند کلاس — برای مقایسه‌ی بین رشته‌ای */
export function subjectsSharedByClassIds(classIds: string[], seriesId?: SeriesId): Subject[] {
  const sets = classIds.map(
    (id) => new Set((seriesId ? subjectsForClassSeries(id, seriesId) : subjectsForClass(id)).map((s) => s.id)),
  );
  return subjects.filter((s) => sets.every((set) => set.has(s.id)));
}

const rawStudents: Array<[string, string, number, number]> = [
  // نام، کلاس، توانایی پایه، روند پیشرفت در هر آزمون
  ['علی رضایی', 'c121', 0.91, 0.02],
  ['حسین قاسمی', 'c121', 0.86, 0.01],
  ['یاسین رحیمی', 'c121', 0.78, 0.015],
  ['مهدی حسینی', 'c122', 0.84, -0.02],
  ['رضا نجفی', 'c122', 0.72, 0.005],
  ['محمدرضا بهرامی', 'c122', 0.65, 0.0],
  ['محمد احمدی', 'c123', 0.88, 0.01],
  ['امیرعلی توکلی', 'c123', 0.75, -0.015],
  ['پارسا صادقی', 'c123', 0.58, 0.025],
  ['امیرحسین کریمی', 'c124', 0.8, -0.005],
  ['طاها نوری', 'c124', 0.69, 0.01],
  ['سینا مرادی', 'c124', 0.62, 0.035],
  ['سهیل اکبری', 'c125', 0.77, -0.01],
  ['آرش شریفی', 'c125', 0.66, 0.03],
  ['کیان میرزایی', 'c125', 0.54, 0.015],
  ['ابوالفضل یوسفی', 'c126', 0.83, 0.02],
  ['محمدطاها جعفری', 'c126', 0.71, -0.01],
  ['عرفان مرادپور', 'c126', 0.49, 0.01],
];

export const students: Student[] = rawStudents.map(([name, classId, ability, trend], i) => ({
  id: `s${i + 1}`,
  name,
  code: String(4010 + i),
  classId,
  phone: `0912${String(1000000 + i * 13457).slice(0, 7)}`,
  guardian: ['پدر', 'مادر'][i % 2],
  ability,
  trend,
  maz: i % 3 !== 0,
}));

const roundsOf: Record<SeriesId, Array<{ title: string; date: string; diff: number; kind: string }>> = {
  ghalamchi: [
    { title: 'قلمچی ۱', date: '1404-08-15', diff: 0.94, kind: 'آزمون' },
    { title: 'قلمچی ۲', date: '1404-09-13', diff: 0.93, kind: 'آزمون' },
    { title: 'قلمچی ۳', date: '1404-10-11', diff: 0.95, kind: 'آزمون' },
    { title: 'قلمچی ۴', date: '1404-11-09', diff: 0.96, kind: 'آزمون' },
  ],
  capsule: [
    { title: 'کپسول ۱', date: '1404-09-20', diff: 0.95, kind: 'آزمون' },
    { title: 'کپسول ۲', date: '1404-11-22', diff: 0.97, kind: 'آزمون' },
  ],
  mostamar1: [{ title: 'مستمر اول', date: '1404-09-05', diff: 1.0, kind: 'مستمر' }],
  nobat1: [{ title: 'نوبت اول', date: '1404-10-10', diff: 0.99, kind: 'نوبت' }],
  mostamar2: [{ title: 'مستمر دوم', date: '1404-11-14', diff: 0.98, kind: 'مستمر' }],
  nobat2: [{ title: 'نوبت دوم', date: '1404-12-10', diff: 0.97, kind: 'نوبت' }],
  maz: [
    { title: 'ماز ۱', date: '1404-09-27', diff: 0.92, kind: 'آزمون' },
    { title: 'ماز ۲', date: '1404-11-20', diff: 0.94, kind: 'آزمون' },
  ],
  moshavere: [
    { title: 'مشاوره ۱', date: '1404-10-02', diff: 0.95, kind: 'آزمون' },
    { title: 'مشاوره ۲', date: '1404-12-01', diff: 0.96, kind: 'آزمون' },
  ],
};

let seed = 20251123;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const exams: Exam[] = [];
export const scores: Score[] = [];

for (const s of series) {
  roundsOf[s.id].forEach((round, roundIndex) => {
    for (const cls of classes) {
      const examId = `${s.id}-${roundIndex + 1}-${cls.id}`;
      exams.push({
        id: examId,
        seriesId: s.id,
        classId: cls.id,
        title: round.title,
        date: round.date,
        kind: round.kind,
        maxScore: s.maxScore,
        round: roundIndex + 1,
      });

      for (const student of students.filter((st) => st.classId === cls.id)) {
        // ماز اختیاری است؛ بعضی دانش‌آموزها نمره‌ی آن را ندارند
        if (s.optional && !student.maz) continue;
        for (const subject of subjectsForClass(cls.id)) {
          const base =
            student.ability *
            subject.difficulty *
            round.diff *
            (1 + student.trend * roundIndex * 1.4) +
            (rnd() - 0.5) * 0.07;
          const ratio = clamp(base, 0.12, 1);
          let value = ratio * s.maxScore;
          value = s.kind === 'percent' ? Math.round(value) : Math.round(value * 4) / 4;
          scores.push({ studentId: student.id, examId, subjectId: subject.id, value });
        }
      }
    }
  });
}

export const records: StudentRecord[] = [
  { id: 'r1', studentId: 's1', category: 'انضباطی', kind: 'تشویق', date: '1404-08-22', text: 'همکاری خوب در فعالیت گروهی کلاس', by: 'خانم موسوی' },
  { id: 'r2', studentId: 's9', category: 'انضباطی', kind: 'تذکر', date: '1404-09-02', text: 'صحبت با هم‌کلاسی هنگام تدریس', by: 'آقای رستمی' },
  { id: 'r3', studentId: 's15', category: 'انضباطی', kind: 'غیبت', date: '1404-09-11', text: 'غیبت بدون اطلاع — دو جلسه', by: 'خانم کاظمی' },
  { id: 'r4', studentId: 's15', category: 'پژوهشی', kind: 'مشاوره', date: '1404-10-03', text: 'جلسه‌ی مشاوره برای برنامه‌ی مطالعه', by: 'خانم کاظمی' },
  { id: 'r5', studentId: 's5', category: 'پژوهشی', kind: 'تشویق', date: '1404-10-08', text: 'بهترین پیشرفت ماه در درس ریاضی', by: 'خانم موسوی' },
  { id: 'r6', studentId: 's10', category: 'انضباطی', kind: 'تذکر', date: '1404-10-19', text: 'تأخیر در تحویل تکالیف هفتگی', by: 'آقای رستمی' },
  { id: 'r7', studentId: 's12', category: 'پژوهشی', kind: 'تشویق', date: '1404-11-01', text: 'ارائه‌ی خوب کنفرانس علوم', by: 'آقای رستمی' },
  { id: 'r8', studentId: 's9', category: 'انضباطی', kind: 'تذکر', date: '1404-11-06', text: 'استفاده از موبایل در زمان کلاس', by: 'آقای رستمی' },
  { id: 'r9', studentId: 's2', category: 'انضباطی', kind: 'تشویق', date: '1404-11-12', text: 'مسئولیت‌پذیری در نظم کلاس', by: 'خانم موسوی' },
  { id: 'r10', studentId: 's14', category: 'پژوهشی', kind: 'مشاوره', date: '1404-11-18', text: 'گفتگو درباره‌ی افت نمره‌های اخیر', by: 'خانم کاظمی' },
  { id: 'r11', studentId: 's4', category: 'فرهنگی', kind: 'فعالیت', date: '1404-09-18', text: 'شرکت در مراسم هفته‌ی دفاع مقدس', by: 'خانم موسوی' },
  { id: 'r12', studentId: 's7', category: 'فرهنگی', kind: 'تشویق', date: '1404-10-24', text: 'اجرای خوب سرود در مراسم صبحگاهی', by: 'آقای رستمی' },
  { id: 'r13', studentId: 's16', category: 'فرهنگی', kind: 'فعالیت', date: '1404-11-09', text: 'مسئول غرفه‌ی نمایشگاه کتاب مدرسه', by: 'خانم کاظمی' },
  { id: 'r14', studentId: 's6', category: 'ورزشی', kind: 'تشویق', date: '1404-09-29', text: 'مقام دوم فوتسال بین‌کلاسی', by: 'آقای رستمی' },
  { id: 'r15', studentId: 's13', category: 'ورزشی', kind: 'فعالیت', date: '1404-10-16', text: 'عضویت در تیم والیبال مدرسه', by: 'آقای رستمی' },
  { id: 'r16', studentId: 's8', category: 'ورزشی', kind: 'تشویق', date: '1404-11-14', text: 'رکورد داروی دو ۱۰۰ متر مدرسه', by: 'آقای رستمی' },
  { id: 'r17', studentId: 's3', category: 'پژوهشی', kind: 'فعالیت', date: '1404-10-11', text: 'ارائه‌ی مقاله در جشنواره‌ی خوارزمی', by: 'خانم موسوی' },
  { id: 'r18', studentId: 's17', category: 'فرهنگی', kind: 'فعالیت', date: '1404-11-21', text: 'همراهی در اردوی راهیان نور', by: 'خانم کاظمی' },
];

export const imports: ImportRecord[] = [
  { id: 'i1', fileName: 'ghalamchi-04-121.pdf', seriesId: 'ghalamchi', method: 'PDF متنی', rows: 3, date: '1404-11-09', status: 'ثبت شد', by: 'خانم موسوی' },
  { id: 'i2', fileName: 'ghalamchi-04-123.pdf', seriesId: 'ghalamchi', method: 'PDF متنی', rows: 3, date: '1404-11-10', status: 'ثبت شد', by: 'آقای رستمی' },
  { id: 'i3', fileName: 'nobat1-121.jpg', seriesId: 'nobat1', method: 'عکس (OCR)', rows: 3, date: '1404-11-15', status: 'نیازمند بازبینی', by: 'آقای شریفی' },
  { id: 'i4', fileName: 'maz-02-125.pdf', seriesId: 'maz', method: 'PDF متنی', rows: 3, date: '1404-11-21', status: 'ثبت شد', by: 'خانم کاظمی' },
];

export const currentUser = { name: 'خانم موسوی', role: 'مدیر و دبیر', username: 'mousavi' };

/* ---------- helpers for lookups ---------- */

export const subjectById = (id: string) => subjects.find((s) => s.id === id)!;
export const classById = (id: string) => classes.find((c) => c.id === id)!;
export const studentById = (id: string) => students.find((s) => s.id === id);
export const examById = (id: string) => exams.find((e) => e.id === id);
export const seriesById = (id: SeriesId) => series.find((s) => s.id === id)!;

/* در حالت واقعی، داده‌ی نمونه‌ی ساختگی حذف می‌شود و فقط داده‌ی واردشده می‌ماند */
if (getDataMode() === 'real') {
  students.length = 0;
  exams.length = 0;
  scores.length = 0;
}

/* داده‌های واردشده از اکسل (در همین مرورگر ذخیره می‌شوند) */
const savedImports = loadSavedImports();
if (savedImports) {
  const removed = new Set(savedImports.removedStudents ?? []);
  if (removed.size > 0) {
    for (let index = students.length - 1; index >= 0; index -= 1) {
      if (removed.has(students[index].id)) students.splice(index, 1);
    }
    for (let index = scores.length - 1; index >= 0; index -= 1) {
      if (removed.has(scores[index].studentId)) scores.splice(index, 1);
    }
  }
  const knownStudents = new Set(students.map((student) => student.id));
  for (const student of savedImports.students) {
    if (!knownStudents.has(student.id)) {
      students.push(student);
      knownStudents.add(student.id);
    }
  }
  const knownExams = new Set(exams.map((exam) => exam.id));
  for (const exam of savedImports.exams) {
    if (!knownExams.has(exam.id)) {
      exams.push(exam);
      knownExams.add(exam.id);
    }
  }
  for (const saved of savedImports.scores) {
    const existing = scores.find(
      (score) =>
        score.studentId === saved.studentId && score.examId === saved.examId && score.subjectId === saved.subjectId,
    );
    if (existing) existing.value = saved.value;
    else scores.push(saved);
  }
}
