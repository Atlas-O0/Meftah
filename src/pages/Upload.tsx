import { useMemo, useState } from 'react';
import {
  classes,
  classById,
  orderedSeries,
  series,
  students,
  subjects,
  subjectsForClassSeries,
  type SeriesId,
} from '../data/mock';
import { fa, faDate } from '../lib/fa';
import { todayJalali } from '../lib/jalali';
import { Badge, Card, Icon } from '../components/ui';
import { extractRows, parseNumber, readSpreadsheet, type SheetMappingInfo } from '../lib/excel';
import {
  applyImport,
  candidateLabel,
  matchRows,
  statusLabel,
  statusTone,
  type ApplyResult,
  type DraftRow,
} from '../lib/importExcel';
import { clearSavedImports } from '../lib/persist';
import { getDataMode } from '../lib/mode';
import { isServerOnline } from '../lib/api';

export default function Upload() {
  const [step, setStep] = useState(1);
  const [seriesId, setSeriesId] = useState<SeriesId>('ghalamchi');
  const [classId, setClassId] = useState('c121');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayJalali());
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [skippedSheets, setSkippedSheets] = useState<string[]>([]);
  const [mappings, setMappings] = useState<SheetMappingInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ApplyResult | null>(null);

  const seriesItem = series.find((s) => s.id === seriesId)!;
  const classItem = classById(classId);

  const subjectColumns = useMemo(() => {
    const ids = new Set<string>();
    drafts.forEach((draft) => Object.keys(draft.values).forEach((id) => ids.add(id)));
    return subjects.filter((subject) => ids.has(subject.id));
  }, [drafts]);

  const counts = useMemo(() => {
    const base = { found: 0, new: 0, ambiguous: 0, other: 0, invalid: 0 };
    drafts.forEach((draft) => {
      base[draft.status] += 1;
    });
    return base;
  }, [drafts]);

  const readyCount = drafts.filter(
    (draft) => draft.status === 'found' || draft.status === 'new' || draft.status === 'other',
  ).length;

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const handleFile = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const sheets = await readSpreadsheet(file);
      const extracted = extractRows(sheets);
      if (extracted.rows.length === 0) {
        setError(
          'در این فایل سطری با «نام» یا «کد دانش‌آموزی» پیدا نشد. مطمئن شو سطر سرستون دارد؛ اگر فایل قدیمی .xls است، در اکسل با «Save As» به .xlsx تبدیلش کن.',
        );
        setBusy(false);
        return;
      }
      setDrafts(matchRows(extracted.rows, seriesId, classId));
      setMappings(extracted.mappings);
      setSkippedSheets(extracted.skippedSheets);
      setFileName(file.name);
      setStep(3);
    } catch (err) {
      setError(`خواندن فایل ممکن نشد: ${err instanceof Error ? err.message : 'خطای نامشخص'}`);
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () => {
    const subs = subjectsForClassSeries(classId, seriesId);
    const head = ['کد دانش‌آموزی', 'نام و نام خانوادگی', 'کلاس', ...subs.map((subject) => subject.name)];
    const rows = students
      .filter((student) => student.classId === classId)
      .map((student) => [student.code, student.name, classItem.name, ...subs.map(() => '')]);
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = `\ufeff${[head, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `قالب-${seriesId}-${classItem.name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep(1);
    setDrafts([]);
    setFileName('');
    setMappings([]);
    setSkippedSheets([]);
    setResult(null);
    setError('');
  };

  return (
    <div className="stack">
      <Card>
        <div className="steps">
          <div className={`step${step === 1 ? ' active' : step > 1 ? ' done' : ''}`}>
            <span className="n">{step > 1 ? '✓' : fa(1)}</span>
            سری، کلاس و آزمون
          </div>
          <span className="step-line" />
          <div className={`step${step === 2 ? ' active' : step > 2 ? ' done' : ''}`}>
            <span className="n">{step > 2 ? '✓' : fa(2)}</span>
            فایل اکسل
          </div>
          <span className="step-line" />
          <div className={`step${step === 3 ? ' active' : step > 3 ? ' done' : ''}`}>
            <span className="n">{step > 3 ? '✓' : fa(3)}</span>
            بازبینی و ثبت
          </div>
        </div>
      </Card>

      {error && (
        <div className="alert info" style={{ borderColor: '#ffc9c9', background: '#fff5f5' }}>
          <Icon name="alert" size={16} />
          <div>{error}</div>
        </div>
      )}

      {step === 1 && (
        <div className="grid cols-2">
          <Card title="این کارنامه‌ها مال کدام سری هستند؟" subtitle="هر سری جدا ذخیره می‌شود؛ هیچ‌وقت با سری دیگری جمع نمی‌شود">
            <div className="stack">
              {orderedSeries.map((item) => (
                <button
                  key={item.id}
                  className="list-item"
                  onClick={() => setSeriesId(item.id)}
                  style={{
                    textAlign: 'right',
                    background: seriesId === item.id ? '#f5f8ff' : 'transparent',
                    border: '1px solid ' + (seriesId === item.id ? '#c9d6ff' : 'transparent'),
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <span className="dot" style={{ background: item.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="bold small">{item.name}</div>
                    <div className="tiny muted">
                      {item.kind === 'percent' ? 'درصدی از ۱۰۰' : `نمره‌ای از ${fa(item.maxScore)}`}
                    </div>
                  </div>
                  {seriesId === item.id && <Badge tone="blue">انتخاب شد</Badge>}
                </button>
              ))}
            </div>
          </Card>

          <Card
            title="کلاس پیش‌فرض و مشخصات آزمون"
            subtitle="اگر فایل ستون «کلاس» نداشته باشد، سطرها به همین کلاس نسبت داده می‌شوند. هر نامی که پروفایل ندارد، هنگام تأیید پروفایل تازه می‌گیرد؛ فایلِ فقط-فهرست هم برای ساختن پروفایل‌ها پذیرفته می‌شود."
          >
            <div className="stack">
              <div className="field">
                <label>کلاس پیش‌فرض</label>
                <select className="select" value={classId} onChange={(event) => setClassId(event.target.value)}>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {fa(students.filter((student) => student.classId === item.id).length)} دانش‌آموز
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid cols-2">
                <div className="field">
                  <label>عنوان آزمون (اختیاری)</label>
                  <input
                    className="input"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={`${seriesItem.name} — ${date}`}
                  />
                </div>
                <div className="field">
                  <label>تاریخ آزمون</label>
                  <input className="input num" value={date} onChange={(event) => setDate(event.target.value)} />
                </div>
              </div>
              <div className="alert info">
                <Icon name="alert" size={16} />
                <div className="small">
                  فایل می‌تواند یک دانش‌آموز باشد، یک کلاس یا چند کلاس؛ برای هر سطر کلاس از ستون «کلاس» یا نام شیت خوانده
                  می‌شود و اگر نبود، همین کلاس پیش‌فرض.
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => setStep(2)}>
                  ادامه
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card
          title="فایل اکسل کارنامه"
          subtitle={`سری: ${seriesItem.name} · کلاس پیش‌فرض: ${classItem.name} · تاریخ: ${faDate(date)}`}
          action={
            <button className="btn sm" onClick={() => setStep(1)}>
              تغییر
            </button>
          }
        >
          <div className="grid cols-2">
            <div className="dropzone">
              <div className="big-icon">
                <Icon name="upload" />
              </div>
              <div className="bold small">فایل اکسل (.xlsx) یا CSV را اینجا رها کن</div>
              <div className="tiny muted">هر شیت جدا خوانده می‌شود؛ سطر سرستون خودکار پیدا می‌شود</div>
              <label className="btn primary" style={{ marginTop: 6 }}>
                {busy ? 'در حال خواندن…' : 'انتخاب فایل'}
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  style={{ display: 'none' }}
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="stack">
              <div className="small">
                ستون‌هایی که شناخته می‌شوند: <b>کد دانش‌آموزی</b>، <b>نام</b> (و در صورت وجود <b>نام خانوادگی</b>)،{' '}
                <b>کلاس</b>، <b>رشته</b> و نام درس‌ها مثل «فارسی ۳»، «حسابان ۲»، «درصد فیزیک».
              </div>
              <div className="tiny muted" style={{ lineHeight: 1.9 }}>
                ستون‌های «رتبه»، «تراز»، «تعداد صحیح» نادیده گرفته می‌شوند. ستون ناشناس هم مشکلی ایجاد نمی‌کند؛ فقط
                استفاده نمی‌شود.
              </div>
              <button className="btn" onClick={downloadTemplate}>
                <Icon name="file" size={15} /> دانلود قالب آماده برای کلاس {classItem.name}
              </button>
              <div className="tiny muted">
                قالب یک فایل CSV است که اکسل بازش می‌کند و نام و کد دانش‌آموزان همان کلاس از قبل در آن هست؛ فقط
                ستون نمره/درصد را پر کن.
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div className="stack">
          <Card
            title="بازبینی سطرهای خوانده‌شده"
            subtitle={`${fileName} · ${fa(drafts.length)} سطر · ${fa(readyCount)} آماده‌ی ثبت`}
            action={
              <div className="row">
                <button className="btn sm" onClick={() => setStep(2)}>
                  فایل دیگر
                </button>
                <button
                  className="btn sm primary"
                  disabled={readyCount === 0}
                  onClick={() => {
                    const applied = applyImport({
                      seriesId,
                      title: title.trim() || `${seriesItem.name} — ${fa(date)}`,
                      date,
                      drafts,
                    });
                    setResult(applied);
                    setStep(4);
                  }}
                >
                  <Icon name="check" size={15} /> تأیید و ثبت
                </button>
              </div>
            }
            flush
          >
            <div className="grid cols-4" style={{ padding: '0 16px 12px' }}>
              <div className="kv">
                <span className="k">پیدا شد</span>
                <span className="bold num">{fa(counts.found)}</span>
              </div>
              <div className="kv">
                <span className="k">پروفایل جدید</span>
                <span className="bold num">{fa(counts.new)}</span>
              </div>
              <div className="kv">
                <span className="k">نیازمند انتخاب</span>
                <span className="bold num">{fa(counts.ambiguous + counts.other)}</span>
              </div>
              <div className="kv">
                <span className="k">ثبت نمی‌شود</span>
                <span className="bold num">{fa(counts.invalid)}</span>
              </div>
            </div>

            {mappings.length > 0 && (
              <div className="tiny muted" style={{ padding: '0 16px 10px', lineHeight: 1.9 }}>
                {mappings.map((mapping) => (
                  <div key={mapping.sheet}>
                    شیت «{mapping.sheet}» — سطر {fa(mapping.headerRow)} سرستون · درس‌های خوانده‌شده:{' '}
                    {mapping.subjectNames.length ? mapping.subjectNames.join('، ') : 'هیچ'}
                    {mapping.ignored.length > 0 && <> · نادیده: {mapping.ignored.join('، ')}</>}
                  </div>
                ))}
                {skippedSheets.length > 0 && <div>شیت‌های بدون سرستون قابل تشخیص: {skippedSheets.join('، ')}</div>}
              </div>
            )}

            <div className="table-wrap">
              <table className="table" style={{ minWidth: 1040 }}>
                <thead>
                  <tr>
                    <th>دانش‌آموز</th>
                    <th>وضعیت</th>
                    <th>کلاس</th>
                    {subjectColumns.map((subject) => (
                      <th key={subject.id} style={{ minWidth: 66, textAlign: 'center' }}>
                        {subject.name}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((row) => (
                    <tr
                      key={row.key}
                      style={{
                        background:
                          row.status === 'invalid' ? '#fff5f5' : row.status === 'ambiguous' ? '#fffdf0' : undefined,
                      }}
                    >
                      <td>
                        <div className="bold small">{row.name || '—'}</div>
                        <div className="tiny muted">
                          {row.code ? `کد ${fa(row.code)} · ` : ''}
                          {row.source}
                        </div>
                        {row.status === 'ambiguous' && row.candidates.length > 0 && (
                          <select
                            className="select"
                            style={{ height: 30, marginTop: 6, fontSize: 12 }}
                            value={row.chosenId}
                            onChange={(event) => updateRow(row.key, { chosenId: event.target.value, status: 'found' })}
                          >
                            <option value="">انتخاب دانش‌آموز…</option>
                            {row.candidates.map((candidate) => (
                              <option key={candidate} value={candidate}>
                                {candidateLabel(candidate)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
                        <div className="tiny muted" style={{ marginTop: 4 }}>
                          {row.note}
                        </div>
                        {row.issues.length > 0 && (
                          <div className="tiny" style={{ color: '#e03131', marginTop: 4 }}>
                            {row.issues.join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="small">{classById(row.classId)?.name ?? '—'}</td>
                      {subjectColumns.map((subject) => {
                        const has = Object.prototype.hasOwnProperty.call(row.values, subject.id);
                        const value = row.values[subject.id];
                        return (
                          <td key={subject.id} style={{ padding: '5px 5px' }}>
                            {has ? (
                              <input
                                className="input num"
                                style={{
                                  width: 58,
                                  height: 30,
                                  textAlign: 'center',
                                  padding: '0 3px',
                                  fontSize: 12,
                                  borderColor: row.issues.some((issue) => issue.includes(subject.name))
                                    ? '#ffc9c9'
                                    : undefined,
                                }}
                                value={value === null || value === undefined ? '' : String(value)}
                                onChange={(event) =>
                                  updateRow(row.key, {
                                    values: { ...row.values, [subject.id]: parseNumber(event.target.value) },
                                  })
                                }
                              />
                            ) : (
                              <span className="tiny muted">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td>
                        <button
                          className="btn ghost sm"
                          title="این سطر ثبت نشود"
                          onClick={() => setDrafts((prev) => prev.filter((item) => item.key !== row.key))}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid cols-2">
            <Card title="با تأیید، چه چیزی ثبت می‌شود؟">
              <div className="stack" style={{ gap: 8 }}>
                <div className="small">
                  {fa(counts.new)} پروفایل جدید ساخته می‌شود و نمره‌های {fa(readyCount)} سطر در پروفایل خودشان
                  می‌نشیند. اگر همین کارنامه دوباره آپلود شود، نمره‌ها به‌روز می‌شوند، نه تکراری.
                </div>
                <div className="row">
                  <Badge tone="green">{fa(counts.found)} پیدا شد</Badge>
                  <Badge tone="blue">{fa(counts.new)} جدید</Badge>
                  <Badge tone="amber">{fa(counts.ambiguous + counts.other)} بررسی</Badge>
                  <Badge tone="red">{fa(counts.invalid)} رد</Badge>
                </div>
              </div>
            </Card>
            <Card title="آزمون این آپلود">
              <div className="kv">
                <span className="k">سری</span>
                <span className="bold">{seriesItem.name}</span>
              </div>
              <div className="kv">
                <span className="k">عنوان</span>
                <span>{title.trim() || `${seriesItem.name} — ${date}`}</span>
              </div>
              <div className="kv">
                <span className="k">تاریخ</span>
                <span className="num">{faDate(date)}</span>
              </div>
              <div className="kv">
                <span className="k">کلاس‌ها</span>
                <span>
                  {Array.from(new Set(drafts.map((row) => row.classId).filter(Boolean)))
                    .map((id) => classById(id)?.name)
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <Card>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '18px 0' }}>
            <div
              className="avatar"
              style={{ width: 54, height: 54, borderRadius: 18, background: '#e6fcf5', color: '#0ca678' }}
            >
              <Icon name="check" size={24} />
            </div>
            <h2>ثبت شد</h2>
            <div className="small muted" style={{ maxWidth: 520, lineHeight: 2 }}>
              {fa(result.newStudents)} پروفایل جدید ساخته شد · {fa(result.rows)} سطر ثبت شد ·{' '}
              {fa(result.scores)} نمره نوشته شد
              {result.exams > 0 ? ` در ${fa(result.exams)} آزمون تازه` : ' (آزمون قبلی به‌روز شد)'}
              {result.skipped > 0 ? ` · ${fa(result.skipped)} سطر رد شد` : ''}
            </div>
            <div className="row">
              <button className="btn" onClick={reset}>
                آپلود بعدی
              </button>
              <a className="btn primary" href="#/students">
                دیدن پروفایل‌ها
              </a>
            </div>
            <div className="tiny muted" style={{ maxWidth: 520 }}>
              این داده‌ها فعلاً در همین مرورگر ذخیره می‌شوند تا با رفرش پاک نشوند؛ با راه‌افتادن دیتابیس، همین
              جریان روی سرور ذخیره می‌شود.
              {getDataMode() === 'demo' && !isServerOnline() && (
                <div style={{ marginTop: 6 }}>
                  داده‌ی نمونه هنوز فعال است؛ برای اینکه فقط داده‌ی واقعی دیده شود، در{' '}
                  <a href="#/settings">تنظیمات</a> دکمه‌ی «حذف داده‌ی نمونه و شروع واقعی» را بزن.
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    if (window.confirm('همه‌ی داده‌های واردشده از اکسل پاک شود؟ (داده‌ی نمونه دست نمی‌خورد)')) {
                      clearSavedImports();
                      window.location.reload();
                    }
                  }}
                >
                  پاک کردن داده‌های واردشده
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
