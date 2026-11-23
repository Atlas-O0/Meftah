import { useMemo, useState } from 'react';
import { classes, exams, scores, series, students, subjects, type SeriesId } from '../data/mock';
import { fa, faDate, faPct, faScore } from '../lib/fa';
import { Badge, Card, Icon } from '../components/ui';

type RowStatus = 'ok' | 'warn' | 'error';

interface DraftRow {
  key: string;
  studentId: string;
  name: string;
  status: RowStatus;
  note: string;
  values: Record<string, string>;
}

export default function Upload() {
  const [step, setStep] = useState(1);
  const [seriesId, setSeriesId] = useState<SeriesId>('ghalamchi');
  const [classId, setClassId] = useState('c121');
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [fileName, setFileName] = useState('');

  const seriesItem = series.find((s) => s.id === seriesId)!;
  const classItem = classes.find((c) => c.id === classId)!;
  const sourceExam = useMemo(() => {
    const list = exams.filter((e) => e.seriesId === seriesId && e.classId === classId);
    return list[list.length - 1];
  }, [seriesId, classId]);

  const buildRows = (name: string) => {
    const list = students.filter((s) => s.classId === classId);
    const draft: DraftRow[] = list.map((student, index) => {
      const values: Record<string, string> = {};
      for (const subject of subjects) {
        const found = scores.find(
          (s) => s.studentId === student.id && s.examId === sourceExam?.id && s.subjectId === subject.id,
        );
        values[subject.id] = found ? String(found.value) : '';
      }
      const status: RowStatus = index === 1 ? 'warn' : index === 3 ? 'error' : 'ok';
      return {
        key: student.id,
        studentId: student.id,
        name: student.name,
        status,
        note:
          status === 'error'
            ? 'نمره‌ی ریاضی خوانده نشد'
            : status === 'warn'
              ? 'دقت خواندن پایین — بررسی شود'
              : 'خوانده شد',
        values,
      };
    });

    if (draft.length > 2) {
      draft[2] = {
        ...draft[2],
        name: 'دانش‌آموز ناشناس',
        status: 'error',
        note: 'در لیست کلاس پیدا نشد',
        studentId: '',
      };
    }

    setRows(draft);
    setFileName(name);
    setStep(3);
  };

  const okCount = rows.filter((r) => r.status === 'ok').length;
  const manualCount = rows.filter((r) => r.status !== 'ok').length;

  const statusTone: Record<RowStatus, 'green' | 'amber' | 'red'> = {
    ok: 'green',
    warn: 'amber',
    error: 'red',
  };

  return (
    <div className="stack">
      <Card>
        <div className="steps">
          <div className={`step${step === 1 ? ' active' : step > 1 ? ' done' : ''}`}>
            <span className="n">{step > 1 ? '✓' : fa(1)}</span>
            انتخاب سری و کلاس
          </div>
          <span className="step-line" />
          <div className={`step${step === 2 ? ' active' : step > 2 ? ' done' : ''}`}>
            <span className="n">{step > 2 ? '✓' : fa(2)}</span>
            آپلود فایل
          </div>
          <span className="step-line" />
          <div className={`step${step === 3 ? ' active' : step > 3 ? ' done' : ''}`}>
            <span className="n">{step > 3 ? '✓' : fa(3)}</span>
            بازبینی و ثبت
          </div>
        </div>
      </Card>

      {step === 1 && (
        <div className="grid cols-2">
          <Card title="این کارنامه‌ها مال کدام سری هستند؟" subtitle="قالب خواندن هر سری جداست؛ فایل‌ها با هم قاطی نمی‌شوند">
            <div className="stack">
              {series.map((s) => (
                <button
                  key={s.id}
                  className="list-item"
                  onClick={() => setSeriesId(s.id)}
                  style={{
                    textAlign: 'right',
                    background: seriesId === s.id ? '#f5f8ff' : 'transparent',
                    border: '1px solid ' + (seriesId === s.id ? '#c9d6ff' : 'transparent'),
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <span className="dot" style={{ background: s.color }} />
                  <div style={{ flex: 1 }}>
                    <div className="bold small">{s.name}</div>
                    <div className="tiny muted">
                      حداکثر {fa(s.maxScore)} · {s.templateNote}
                    </div>
                  </div>
                  {seriesId === s.id && <Badge tone="blue">انتخاب شد</Badge>}
                </button>
              ))}
            </div>
          </Card>

          <Card title="کلاس" subtitle="نمره‌ها به دانش‌آموزان همین کلاس نسبت داده می‌شوند">
            <div className="stack">
              {classes.map((c) => (
                <button
                  key={c.id}
                  className="list-item"
                  onClick={() => setClassId(c.id)}
                  style={{
                    textAlign: 'right',
                    background: classId === c.id ? '#f5f8ff' : 'transparent',
                    border: '1px solid ' + (classId === c.id ? '#c9d6ff' : 'transparent'),
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div className="avatar">{c.name.slice(-1)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="bold small">{c.name}</div>
                    <div className="tiny muted">
                      پایه {c.grade} · {fa(students.filter((s) => s.classId === c.id).length)} دانش‌آموز
                    </div>
                  </div>
                  {classId === c.id && <Badge tone="blue">انتخاب شد</Badge>}
                </button>
              ))}
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn primary" onClick={() => setStep(2)}>
                ادامه
              </button>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card
          title="فایل کارنامه"
          subtitle={`سری: ${seriesItem.name} · کلاس: ${classItem.name}`}
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
              <div className="bold small">فایل PDF یا عکس را اینجا رها کن</div>
              <div className="tiny muted">PDF متنی، عکس اسکن‌شده، یا چند فایل با هم</div>
              <label className="btn primary" style={{ marginTop: 6 }}>
                انتخاب فایل
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    buildRows(file?.name ?? 'sample.pdf');
                  }}
                />
              </label>
            </div>

            <div className="stack">
              <div className="alert info">
                <Icon name="alert" size={16} />
                <div>
                  در این نسخه‌ی نمایشی، فایل واقعاً خوانده نمی‌شود. با دکمه‌ی زیر همان مسیر
                  «بازبینی» را ببین.
                </div>
              </div>
              <button className="btn primary" onClick={() => buildRows(`${seriesId}-${classItem.name}-demo.pdf`)}>
                استفاده از نمونه و رفتن به بازبینی
              </button>
              <div className="tiny muted" style={{ lineHeight: 1.9 }}>
                در نسخه‌ی واقعی: PDF متنی با استخراج متن خوانده می‌شود، عکس با OCR محلی فقط در
                کادرهای نمره. اسم دانش‌آموز از لیست کلاس تطبیق داده می‌شود، نه از روی عکس.
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && (
        <div className="stack">
          <Card
            title="بازبینی نمره‌های خوانده‌شده"
            subtitle={`${fileName} · ${fa(rows.length)} سطر · ${fa(okCount)} سالم · ${fa(manualCount)} نیازمند بررسی`}
            action={
              <div className="row">
                <button className="btn sm" onClick={() => setStep(2)}>
                  فایل دیگر
                </button>
                <button className="btn sm primary" onClick={() => setStep(4)}>
                  <Icon name="check" size={15} /> تأیید و ثبت
                </button>
              </div>
            }
            flush
          >
            <div className="table-wrap">
              <table className="table" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', right: 0, background: '#fbfcfe', zIndex: 2 }}>دانش‌آموز</th>
                    <th>وضعیت</th>
                    {subjects.map((subject) => (
                      <th key={subject.id} style={{ minWidth: 66, textAlign: 'center' }}>
                        {subject.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      style={{
                        background:
                          row.status === 'error' ? '#fff5f5' : row.status === 'warn' ? '#fffdf0' : undefined,
                      }}
                    >
                      <td
                        style={{
                          position: 'sticky',
                          right: 0,
                          zIndex: 2,
                          background:
                            row.status === 'error' ? '#fff5f5' : row.status === 'warn' ? '#fffdf0' : '#fff',
                        }}
                      >
                        <div className="bold small">{row.name}</div>
                        <div className="tiny muted">{row.note}</div>
                      </td>
                      <td>
                        <Badge tone={statusTone[row.status]}>{row.status === 'ok' ? 'سالم' : 'بررسی'}</Badge>
                      </td>
                      {subjects.map((subject) => (
                        <td key={subject.id} style={{ padding: '5px 5px' }}>
                          <input
                            className="input num"
                            style={{
                              width: 56,
                              height: 30,
                              textAlign: 'center',
                              padding: '0 3px',
                              fontSize: 12,
                              borderColor: row.status !== 'ok' ? '#ffd8a8' : undefined,
                            }}
                            value={row.values[subject.id] ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, values: { ...r.values, [subject.id]: value } }
                                    : r,
                                ),
                              );
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid cols-2">
            <Card title="خلاصه‌ی این آپلود">
              <div className="kv">
                <span className="k">سری</span>
                <span className="bold">{seriesItem.name}</span>
              </div>
              <div className="kv">
                <span className="k">کلاس</span>
                <span className="bold">{classItem.name}</span>
              </div>
              <div className="kv">
                <span className="k">تاریخ آزمون</span>
                <span className="num">{sourceExam ? faDate(sourceExam.date) : '—'}</span>
              </div>
              <div className="kv">
                <span className="k">حداکثر نمره</span>
                <span className="num">{fa(seriesItem.maxScore)}</span>
              </div>
              <div className="kv">
                <span className="k">روش خواندن</span>
                <span>PDF متنی</span>
              </div>
            </Card>
            <Card title="چه چیزی ذخیره می‌شود؟">
              <div className="stack" style={{ gap: 8 }}>
                <div className="small">
                  فقط پس از تأیید تو، نمره‌ها ثبت می‌شوند. فایل اصلی هم نگه داشته می‌شود تا بعداً
                  بشود دوباره بازبینی کرد.
                </div>
                <div className="small muted">
                  هر آپلود یک رکورد جدا می‌گیرد؛ اگر اشتباه بود، کل این دسته یک‌جا حذف می‌شود.
                </div>
                <div className="row">
                  <Badge tone="green">{fa(okCount)} سطر سالم</Badge>
                  <Badge tone="amber">{fa(manualCount)} نیازمند بررسی</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 4 && (
        <Card>
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center', padding: '18px 0' }}>
            <div
              className="avatar"
              style={{ width: 54, height: 54, borderRadius: 18, background: '#e6fcf5', color: '#0ca678' }}
            >
              <Icon name="check" size={24} />
            </div>
            <h2>آپلود بسته شد (نمایشی)</h2>
            <p className="small muted" style={{ maxWidth: 460 }}>
              در نسخه‌ی واقعی، {fa(rows.length)} سطر در پروفایل دانش‌آموزان سری «{seriesItem.name}»
              ثبت می‌شد و نمودار رشد آن‌ها به‌روز می‌شد. اینجا چیزی ذخیره نشده است.
            </p>
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  setStep(1);
                  setRows([]);
                }}
              >
                آپلود بعدی
              </button>
              <a className="btn primary" href="#/students">
                دیدن پروفایل‌ها
              </a>
            </div>
          </div>
        </Card>
      )}

      <Card title="سه مسیر همیشه در دسترس" flush>
        <div className="grid cols-3" style={{ padding: 16 }}>
          {[
            {
              t: 'PDF متنی',
              d: 'متن استخراج می‌شود؛ دقیق‌ترین و رایگان.',
              b: seriesItem.hasTemplate ? 'قالب دارد' : 'قالب ندارد',
            },
            { t: 'عکس / اسکن', d: 'OCR محلی فقط در کادرهای نمره؛ اسم از لیست کلاس.', b: 'OCR مرورگر' },
            { t: 'کنار-هم-تایپ', d: 'عکس یک طرف، جدول نمره طرف دیگر؛ همیشه کار می‌کند.', b: 'دستی' },
          ].map((item) => (
            <div key={item.t} className="stack" style={{ gap: 5 }}>
              <div className="row" style={{ gap: 6 }}>
                <Icon name="file" size={15} />
                <span className="bold small">{item.t}</span>
                <Badge line>{item.b}</Badge>
              </div>
              <div className="tiny muted">{item.d}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="tiny muted">
        راهنما: در آزمون نمونه‌ی «{sourceExam?.title ?? '—'}» تعداد {fa(rows.length || 0)} سطر
        خوانده شده است. درصد هر سطر پس از ثبت، همان چیزی است که در پروفایل دانش‌آموز می‌بینی
        ({faPct(sourceExam ? 62 : 0, 0)} نمونه).
      </div>
    </div>
  );
}
