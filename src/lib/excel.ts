/**
 * خواندن فایل اکسل و تشخیص خودکار چیدمان کارنامه.
 *
 * پشتیبانی: .xlsx (همه‌ی شیت‌ها) و .csv (در اکسل باز می‌شود).
 * چیدمان ثابت فرض نمی‌شود؛ سطر سرستون پیدا می‌شود و ستون «نام»، «کد»، «کلاس»
 * و ستون هر درس بر اساس نامشان تشخیص داده می‌شوند. ستون‌های ناشناس نادیده گرفته می‌شوند
 * و در بازبینی به کاربر نشان داده می‌شوند.
 */

import readXlsxFile from 'read-excel-file/browser';
import { classes, subjects } from '../data/mock';

export type Cell = string | number | boolean | Date | null | undefined;

export interface SheetRows {
  name: string;
  rows: Cell[][];
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام فارسی/عربی → لاتین */
export function toLatinDigits(input: string): string {
  let out = '';
  for (const char of input) {
    const p = PERSIAN_DIGITS.indexOf(char);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    const a = ARABIC_DIGITS.indexOf(char);
    out += a >= 0 ? String(a) : char;
  }
  return out;
}

/** متن یکدست: ارقام لاتین، ی/ک یکسان، فاصله‌ی معمولی */
export function normText(cell: Cell): string {
  if (cell === null || cell === undefined || cell instanceof Date) return '';
  return toLatinDigits(String(cell))
    .replace(/[ىي]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\u200e\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** متن نمایشی: بدون دست‌کاری نیم‌فاصله و حروف، فقط ارقام و فاصله‌های تکراری */
export function displayText(cell: Cell): string {
  if (cell === null || cell === undefined || cell instanceof Date) return '';
  return toLatinDigits(String(cell)).replace(/\s+/g, ' ').trim();
}

/** کلید مقایسه: بدون فاصله و نقطه‌گذاری */
export function normKey(cell: Cell): string {
  return normText(cell).replace(/[\s.,،:;()\-_/\\«»"'’∗*]/g, '');
}

/** عدد از هر سلولی: «٪۶۲.۵»، «62.5»، 62.5 */
export function parseNumber(cell: Cell): number | null {
  if (cell === null || cell === undefined) return null;
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null;
  if (typeof cell === 'boolean') return null;
  const text = toLatinDigits(String(cell))
    .replace(/[٪%]/g, '')
    .replace(/[،,٬]/g, '')
    .replace(/٫/g, '.')
    .trim();
  if (!text || /^[-—–]+$/.test(text)) return null;
  const cleaned = text.replace(/[^\d.\-]/g, '');
  if (!cleaned || /^-?\.?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** کد بدون صفر ابتدایی و بدون فاصله، فقط رقم */
export function parseCode(cell: Cell): string {
  if (cell === null || cell === undefined) return '';
  const digits = toLatinDigits(String(cell)).replace(/\D/g, '');
  return digits.replace(/^0+/, '');
}

/* ------------------------------ خواندن فایل ------------------------------ */

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseDelimited(text: string): Cell[][] {
  const clean = text.replace(/^\ufeff/, '');
  const lines = clean.split(/\r?\n/).filter((line, index, all) => line.trim() !== '' || index < all.length - 1);
  if (lines.length === 0) return [];
  const sample = lines.slice(0, 5).join('\n');
  const delimiter = sample.includes('\t') ? '\t' : sample.includes(';') && !sample.includes(',') ? ';' : ',';
  return lines.map((line) => splitCsvLine(line, delimiter));
}

/** همه‌ی شیت‌های فایل (csv یک شیت) */
export async function readSpreadsheet(file: File): Promise<SheetRows[]> {
  if (/\.csv$/i.test(file.name)) {
    return [{ name: file.name.replace(/\.[^.]+$/, ''), rows: parseDelimited(await file.text()) }];
  }
  const workbook = await readXlsxFile(file);
  return workbook.map((sheet) => ({ name: sheet.sheet, rows: sheet.data }));
}

/* --------------------------- تشخیص ستون‌ها --------------------------- */

const SUBJECT_ALIASES: Record<string, string[]> = {
  literature: ['فارسی', 'ادبیاتفارسی', 'ادبیات'],
  writing: ['نگارش', 'انشا'],
  arabic: ['عربی', 'زبانقرآن'],
  religion: ['دینوزندگی', 'دینی', 'دین'],
  english: ['زبانخارجی', 'زبانانگلیسی', 'انگلیسی', 'زبان'],
  health: ['سلامتوبهداشت', 'سلامت'],
  identity: ['هویتاجتماعی', 'هویت'],
  family: ['مدیریتخانواده', 'سبکزندگی', 'خانواده'],
  calculus: ['حسابان', 'حسابدیفرانسیل'],
  geometry: ['هندسه'],
  discrete: ['ریاضیاتگسسته', 'گسسته'],
  math: ['ریاضی۳', 'ریاضی'],
  biology: ['زیستشناسی', 'زیست'],
  physics: ['فیزیک'],
  chemistry: ['شیمی'],
};

const HEADER_STOPWORDS = ['درصد', 'نمره', 'نهایی', 'کتبی', 'شفاهی', 'تراز', 'رتبه', 'مدرسه', 'کلاسی'];

const subjectAliases: Array<{ alias: string; subjectId: string }> = Object.entries(SUBJECT_ALIASES)
  .flatMap(([subjectId, aliases]) => aliases.map((alias) => ({ alias: normKey(alias), subjectId })))
  .filter((item) => item.alias.length > 0)
  .sort((a, b) => b.alias.length - a.alias.length);

/** ستون درس از روی عنوان: «درصد حسابان ۲»، «حسابان», «فیزیک ۳» */
export function subjectFromHeader(cell: Cell): string | null {
  const raw = normKey(cell);
  if (!raw) return null;
  let key = raw;
  for (const word of HEADER_STOPWORDS) key = key.split(normKey(word)).join('');
  if (!key) return null;
  for (const item of subjectAliases) {
    if (key === item.alias || key.includes(item.alias)) return item.subjectId;
  }
  return null;
}

const isRankHeader = (cell: Cell) => /رتبه|تراز|نزده|غلط|صحیح|تعداد/.test(normText(cell));

const isNameHeader = (cell: Cell) => {
  const key = normKey(cell);
  if (/خانوادگی|فامیل|پدر|مادر|ولی|تلفن|موبایل|کد|شماره|درس|آزمون|کلاس|رشته|دبیر|معلم|مدرسه/.test(key)) {
    return false;
  }
  return key.includes('نام') || key.includes('دانشآموز') || key === 'اسم' || key.includes('مشخصات');
};

const isFamilyHeader = (cell: Cell) => /نامخانوادگی|خانوادگی|فامیل/.test(normKey(cell));

const isCodeHeader = (cell: Cell) => {
  const key = normKey(cell);
  return key.includes('کد') || key.includes('شمارهدانش') || key === 'شماره';
};

const isClassHeader = (cell: Cell) => {
  const key = normKey(cell);
  return key.includes('کلاس') || key.includes('شعبه') || key.includes('گروه');
};

const isTrackHeader = (cell: Cell) => /رشته|شاخه/.test(normText(cell));

export interface ColumnMapping {
  headerRow: number;
  nameCol: number;
  familyCol: number;
  codeCol: number;
  classCol: number;
  trackCol: number;
  /** ستون → شناسه‌ی درس */
  subjectCols: Array<{ col: number; subjectId: string }>;
  /** عنوان ستون‌هایی که استفاده نشدند */
  ignored: string[];
}

/** اولین سطر معتبر سرستون در یک شیت */
export function detectMapping(rows: Cell[][]): ColumnMapping | null {
  let best: { row: number; mapping: ColumnMapping; score: number } | null = null;

  for (let row = 0; row < Math.min(rows.length, 25); row += 1) {
    const cells = rows[row] ?? [];
    let nameCol = -1;
    let familyCol = -1;
    let codeCol = -1;
    let classCol = -1;
    let trackCol = -1;
    const subjectCols: Array<{ col: number; subjectId: string }> = [];
    const used = new Set<number>();

    cells.forEach((cell, col) => {
      if (cell === null || cell === undefined || String(cell).trim() === '') return;
      if (familyCol < 0 && isFamilyHeader(cell)) {
        familyCol = col;
        used.add(col);
        return;
      }
      if (nameCol < 0 && isNameHeader(cell)) {
        nameCol = col;
        used.add(col);
        return;
      }
      if (codeCol < 0 && isCodeHeader(cell)) {
        codeCol = col;
        used.add(col);
        return;
      }
      if (classCol < 0 && isClassHeader(cell)) {
        classCol = col;
        used.add(col);
        return;
      }
      if (trackCol < 0 && isTrackHeader(cell)) {
        trackCol = col;
        used.add(col);
        return;
      }
      if (isRankHeader(cell)) return;
      const subjectId = subjectFromHeader(cell);
      if (subjectId && !subjectCols.some((item) => item.subjectId === subjectId)) {
        subjectCols.push({ col, subjectId });
        used.add(col);
      }
    });

    const hasIdentity = nameCol >= 0 || familyCol >= 0 || codeCol >= 0;
    const score =
      (nameCol >= 0 ? 3 : 0) +
      (familyCol >= 0 ? 3 : 0) +
      (codeCol >= 0 ? 1 : 0) +
      (classCol >= 0 ? 1 : 0) +
      subjectCols.length;
    if (!hasIdentity) continue;
    /* شیتی که فقط فهرست نام است (بدون ستون نمره) هم پذیرفته می‌شود تا از روی آن پروفایل ساخته شود */
    if (subjectCols.length === 0 && nameCol < 0 && familyCol < 0) continue;
    if (score >= 3 && (!best || score > best.score)) {
      best = {
        row,
        score,
        mapping: {
          headerRow: row,
          nameCol,
          familyCol,
          codeCol,
          classCol,
          trackCol,
          subjectCols,
          ignored: cells
            .map((cell, col) => ({ cell, col }))
            .filter(({ cell, col }) => !used.has(col) && cell !== null && String(cell).trim() !== '')
            .map(({ cell }) => normText(cell)),
        },
      };
    }
  }

  return best ? best.mapping : null;
}

const SUMMARY_WORDS = ['جمع', 'میانگین', 'معدل', 'ردیف', 'تعداد', 'کلاسی', 'مدرسه'];

export interface RawRow {
  sheet: string;
  rowNumber: number;
  name: string;
  code: string;
  classHint: string;
  trackHint: string;
  values: Record<string, number>;
}

/** تبدیل کلاس فایل به شناسه‌ی کلاس (۱۲۱ / کلاس 121 / دوازدهم ۱۲۱) */
export function resolveClassId(hint: Cell): string | null {
  const text = toLatinDigits(normText(hint));
  if (!text) return null;
  const digits = text.match(/\d{1,4}/g);
  if (!digits) return null;
  const number = digits[digits.length - 1].replace(/^0+/, '');
  const found = classes.find((c) => toLatinDigits(c.name).replace(/\D/g, '').replace(/^0+/, '') === number);
  return found ? found.id : null;
}

export interface SheetMappingInfo {
  sheet: string;
  headerRow: number;
  subjectNames: string[];
  ignored: string[];
}

/** خواندن سطرهای داده از همه‌ی شیت‌ها */
export function extractRows(sheets: SheetRows[]): {
  rows: RawRow[];
  skippedSheets: string[];
  mappings: SheetMappingInfo[];
} {
  const rows: RawRow[] = [];
  const skippedSheets: string[] = [];
  const mappings: SheetMappingInfo[] = [];

  for (const sheet of sheets) {
    const mapping = detectMapping(sheet.rows);
    if (!mapping) {
      skippedSheets.push(sheet.name);
      continue;
    }

    mappings.push({
      sheet: sheet.name,
      headerRow: mapping.headerRow + 1,
      subjectNames: mapping.subjectCols.map((item) => subjectNameById(item.subjectId)),
      ignored: mapping.ignored,
    });

    for (let index = mapping.headerRow + 1; index < sheet.rows.length; index += 1) {
      const cells = sheet.rows[index] ?? [];
      const namePart = displayText(mapping.nameCol >= 0 ? cells[mapping.nameCol] : '');
      const familyPart = displayText(mapping.familyCol >= 0 ? cells[mapping.familyCol] : '');
      const name = [namePart, familyPart].filter(Boolean).join(' ').trim();
      const code = parseCode(mapping.codeCol >= 0 ? cells[mapping.codeCol] : '');
      const classHint = normText(mapping.classCol >= 0 ? cells[mapping.classCol] : '');
      const trackHint = normText(mapping.trackCol >= 0 ? cells[mapping.trackCol] : '');
      const nameKey = normKey(name);

      if (!name && !code) continue;
      if (SUMMARY_WORDS.includes(nameKey) || SUMMARY_WORDS.some((word) => nameKey === normKey(word))) continue;
      if (mapping.headerRow === index) continue;

      const values: Record<string, number> = {};
      for (const { col, subjectId } of mapping.subjectCols) {
        const value = parseNumber(cells[col]);
        if (value !== null) values[subjectId] = value;
      }
      if (Object.keys(values).length === 0 && !name) continue;

      rows.push({
        sheet: sheet.name,
        rowNumber: index + 1,
        name,
        code,
        classHint: classHint || (resolveClassId(sheet.name) ? sheet.name : ''),
        trackHint,
        values,
      });
    }
  }

  return { rows, skippedSheets, mappings };
}

/** نام درسی که ستونش خوانده شد — برای نمایش به کاربر */
export const subjectNameById = (id: string): string => subjects.find((s) => s.id === id)?.name ?? id;
