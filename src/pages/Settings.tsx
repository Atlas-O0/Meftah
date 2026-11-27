import { Fragment, useEffect, useState } from 'react';
import {
  classes,
  series,
  students,
  subjectTrackLabels,
  subjects,
  trackLabels,
  type SeriesId,
  type TrackId,
} from '../data/mock';
import { fa, faPct, faScore } from '../lib/fa';
import { getDataMode, setDataMode } from '../lib/mode';
import { backupUrl, fetchHealth, isServerOnline, type ServerHealth } from '../lib/api';
import { dataSource } from '../lib/bootstrap';
import {
  SCORE_LIMIT,
  defaultSubjectThresholds,
  getSubjectThresholds,
  setSubjectThresholds,
  type SubjectThresholdMap,
} from '../lib/thresholds';
import { Badge, Card, Icon, Modal, Progress } from '../components/ui';
import {
  addClass,
  addTeacher,
  getCustomClasses,
  getTeachers,
  removeTeacher,
  useDirectoryVersion,
} from '../lib/directory';

export default function Settings() {
  const [thresholds, setThresholds] = useState<Record<SeriesId, { strong: number; good: number; pass: number }>>(
    () =>
      Object.fromEntries(series.map((s) => [s.id, { ...s.thresholds }])) as Record<
        SeriesId,
        { strong: number; good: number; pass: number }
      >,
  );

  const preview = (value: number, t: { strong: number; good: number; pass: number }) => {
    if (value >= t.strong) return { label: 'قوی', tone: 'green' as const };
    if (value >= t.good) return { label: 'خوب', tone: 'blue' as const };
    if (value >= t.pass) return { label: 'متوسط', tone: 'amber' as const };
    return { label: 'نیازمند توجه', tone: 'red' as const };
  };

  const mode = getDataMode();
  const [subjectThresholds, setDraft] = useState<SubjectThresholdMap>(() => getSubjectThresholds());
  const [savedNotice, setSavedNotice] = useState('');
  const online = isServerOnline() || dataSource.online;
  const [health, setHealth] = useState<ServerHealth | null>(null);

  useDirectoryVersion();
  const customClasses = getCustomClasses();
  const teacherList = getTeachers();
  const [directoryNotice, setDirectoryNotice] = useState('');
  const flashDirectory = (message: string) => {
    setDirectoryNotice(message);
    window.setTimeout(() => setDirectoryNotice(''), 4000);
  };

  const [classOpen, setClassOpen] = useState(false);
  const [className, setClassName] = useState('');
  const [classTrack, setClassTrack] = useState<TrackId>('math');
  const [classTeacher, setClassTeacher] = useState('');
  const [classError, setClassError] = useState('');

  const [teacherOpen, setTeacherOpen] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherRole, setTeacherRole] = useState('');
  const [teacherClasses, setTeacherClasses] = useState('');
  const [teacherError, setTeacherError] = useState('');

  useEffect(() => {
    if (!online) return;
    let alive = true;
    void fetchHealth().then((data) => {
      if (alive) setHealth(data);
    });
    return () => {
      alive = false;
    };
  }, [online]);

  return (
    <div className="stack">
      <Card
        title="داده‌ی نمونه و شروع واقعی"
        subtitle={
          online
            ? 'سرور متصل است؛ همه‌ی صفحه‌ها فقط داده‌ی دیتابیس را نشان می‌دهند و داده‌ی نمونه نمایش داده نمی‌شود'
            : 'داده‌ی نمونه (کلاس‌ها و نمره‌های ساختگی) فقط برای دیدن ظاهر است؛ قبل از شروع سال تحصیلی حذفش کن'
        }
        action={
          <Badge tone={online ? 'green' : mode === 'demo' ? 'amber' : 'green'}>
            {online ? 'داده از دیتابیس' : mode === 'demo' ? 'داده‌ی نمونه فعال' : 'فقط داده‌ی واقعی'}
          </Badge>
        }
      >
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <div className="small" style={{ flex: 1, minWidth: 240, lineHeight: 1.9 }}>
            {online ? (
              <>
                دیتابیس فعال است، پس داده‌ی نمونه به‌طور خودکار کنار گذاشته می‌شود و هر چه می‌بینی از{' '}
                <span style={{ direction: 'ltr', display: 'inline-block' }}>data/meftah.db</span> می‌آید. الآن{' '}
                {fa(students.length)} دانش‌آموز در دیتابیس ثبت شده است. اگر می‌خواهی ظاهر سایت را با داده‌ی نمونه
                ببینی، سایت را بدون سرور (مثلاً همان نسخه‌ی Render) باز کن.
              </>
            ) : (
              <>
                در حالت واقعی، ۱۸ دانش‌آموز نمونه و همه‌ی نمره‌های ساختگی از تمام صفحه‌ها حذف می‌شوند.
                کلاس‌ها و درس‌ها (ساختار مدرسه) می‌مانند و آپلودهای واقعی هم دست نمی‌خورند. الآن{' '}
                {fa(students.length)} دانش‌آموز نمایش داده می‌شود.
              </>
            )}
          </div>
          {!online && (
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn primary"
                disabled={mode === 'real'}
                onClick={() => {
                  if (
                    window.confirm(
                      'داده‌ی نمونه حذف شود؟ کلاس‌ها و درس‌ها می‌مانند؛ دانش‌آموزان و نمره‌های ساختگی از نمایش حذف می‌شوند. آپلودهای واقعی حفظ می‌شوند.',
                    )
                  ) {
                    setDataMode('real');
                    window.location.reload();
                  }
                }}
              >
                حذف داده‌ی نمونه و شروع واقعی
              </button>
              <button
                className="btn"
                disabled={mode === 'demo'}
                onClick={() => {
                  setDataMode('demo');
                  window.location.reload();
                }}
              >
                بازگرداندن داده‌ی نمونه
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid cols-2">
        <Card title="کلاس‌ها" subtitle={`${fa(classes.length)} کلاس فعال — پایه دوازدهم`}>
          {classes.map((c) => (
            <div className="list-item" key={c.id}>
              <div className="avatar">{c.name.slice(-1)}</div>
              <div style={{ flex: 1 }}>
                <div className="bold small">{c.name}</div>
                <div className="tiny muted">
                  پایه {c.grade} · {trackLabels[c.track]} · دبیر {c.teacher} ·{' '}
                  {fa(students.filter((s) => s.classId === c.id).length)} دانش‌آموز
                </div>
              </div>
              {customClasses.some((custom) => custom.id === c.id) ? (
                <Badge tone="blue" line>
                  تازه
                </Badge>
              ) : (
                <Badge line>فعال</Badge>
              )}
            </div>
          ))}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm" onClick={() => setClassOpen(true)}>
              <Icon name="plus" size={15} /> کلاس جدید
            </button>
          </div>
        </Card>

        <Card title="معلم‌ها" subtitle="فهرست دبیران مدرسه (برای نمایش و امضای کارنامه)">
          {teacherList.map((t) => (
            <div className="list-item" key={t.id}>
              <div className="avatar">{t.name.replace('خانم ', '').replace('آقای ', '').slice(0, 1)}</div>
              <div style={{ flex: 1 }}>
                <div className="bold small">{t.name}</div>
                <div className="tiny muted">
                  {t.role} · {t.classes}
                </div>
              </div>
              <Badge tone={t.role.startsWith('مدیر') ? 'blue' : 'gray'}>
                {t.role.startsWith('مدیر') ? 'مدیر' : 'معلم'}
              </Badge>
              <button
                className="btn ghost sm"
                title="حذف این معلم"
                aria-label={`حذف ${t.name}`}
                onClick={() => {
                  if (window.confirm(`«${t.name}» از فهرست معلم‌ها حذف شود؟`)) {
                    removeTeacher(t.id);
                    flashDirectory('معلم حذف شد.');
                  }
                }}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm" onClick={() => setTeacherOpen(true)}>
              <Icon name="plus" size={15} /> معلم جدید
            </button>
          </div>
        </Card>
      </div>

      {directoryNotice && (
        <div className="alert info" role="status">
          <Icon name="check" size={16} />
          <div>{directoryNotice}</div>
        </div>
      )}

      <Modal
        open={classOpen}
        title="کلاس جدید"
        onClose={() => {
          setClassOpen(false);
          setClassError('');
        }}
        footer={
          <>
            <button
              className="btn primary"
              onClick={() => {
                const result = addClass({ name: className, track: classTrack, teacher: classTeacher });
                if (!result.ok) {
                  setClassError(result.error);
                  return;
                }
                setClassName('');
                setClassTeacher('');
                setClassError('');
                setClassOpen(false);
                flashDirectory(`کلاس ${result.cls.name} ساخته شد.`);
              }}
            >
              ساخت کلاس
            </button>
            <button className="btn" onClick={() => setClassOpen(false)}>
              انصراف
            </button>
          </>
        }
      >
        <div className="grid cols-2">
          <div className="field">
            <label>نام کلاس</label>
            <input
              className="input num"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="۱۲۷"
            />
          </div>
          <div className="field">
            <label>رشته</label>
            <select
              className="select"
              value={classTrack}
              onChange={(event) => setClassTrack(event.target.value as TrackId)}
            >
              <option value="math">ریاضی فیزیک</option>
              <option value="science">علوم تجربی</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>دبیر / مشاور (اختیاری)</label>
          <input
            className="input"
            value={classTeacher}
            onChange={(event) => setClassTeacher(event.target.value)}
            placeholder="خانم موسوی"
          />
        </div>
        {classError && <div className="small" style={{ color: '#e03131' }}>{classError}</div>}
        <div className="tiny muted">
          پایه دوازدهم؛ کلاس تازه در فهرست کلاس‌ها، فیلتر بالای صفحه و آپلود اکسل می‌آید.
        </div>
      </Modal>

      <Modal
        open={teacherOpen}
        title="معلم جدید"
        onClose={() => {
          setTeacherOpen(false);
          setTeacherError('');
        }}
        footer={
          <>
            <button
              className="btn primary"
              onClick={() => {
                const result = addTeacher({ name: teacherName, role: teacherRole, classes: teacherClasses });
                if (!result.ok) {
                  setTeacherError(result.error);
                  return;
                }
                setTeacherName('');
                setTeacherRole('');
                setTeacherClasses('');
                setTeacherError('');
                setTeacherOpen(false);
                flashDirectory(`${result.teacher.name} به فهرست معلم‌ها اضافه شد.`);
              }}
            >
              افزودن معلم
            </button>
            <button className="btn" onClick={() => setTeacherOpen(false)}>
              انصراف
            </button>
          </>
        }
      >
        <div className="grid cols-2">
          <div className="field">
            <label>نام و نام خانوادگی</label>
            <input
              className="input"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="آقای رستمی"
            />
          </div>
          <div className="field">
            <label>سمت / درس</label>
            <input
              className="input"
              value={teacherRole}
              onChange={(event) => setTeacherRole(event.target.value)}
              placeholder="دبیر فیزیک"
            />
          </div>
        </div>
        <div className="field">
          <label>کلاس‌ها (اختیاری)</label>
          <input
            className="input"
            value={teacherClasses}
            onChange={(event) => setTeacherClasses(event.target.value)}
            placeholder="۱۲۳ ریاضی فیزیک · ۱۲۴ تجربی"
          />
        </div>
        {teacherError && <div className="small" style={{ color: '#e03131' }}>{teacherError}</div>}
      </Modal>

      <Card title="دروس و ضریب‌ها" subtitle="میانگین‌ها وزنی محاسبه می‌شوند؛ ضریب هر درس اینجا تعیین می‌شود" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>درس</th>
                <th>رشته</th>
                <th>ضریب</th>
                <th style={{ width: 200 }}>وزن در میانگین</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="small bold">{s.name}</td>
                  <td>
                    <Badge line>{subjectTrackLabels[s.track]}</Badge>
                  </td>
                  <td className="num small">{fa(s.weight)}</td>
                  <td>
                    <Progress value={(s.weight / 4) * 100} color="#4c6ef5" />
                  </td>
                  <td>
                    <Badge line>فعال</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="مرز نمره‌ی هر درس"
        subtitle="برای هر درس جدا تعیین کن چه نمره‌ای «خوب» و چه نمره‌ای «متوسط» است؛ تستی با درصد، تشریحی با نمره"
        action={<Badge tone="blue">قابل ویرایش</Badge>}
        flush
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th rowSpan={2}>درس</th>
                <th colSpan={2} style={{ textAlign: 'center' }}>
                  تستی (درصد از ۱۰۰)
                </th>
                <th colSpan={2} style={{ textAlign: 'center' }}>
                  تشریحی (نمره از {fa(SCORE_LIMIT)})
                </th>
                <th rowSpan={2}>وضعیت نمونه</th>
              </tr>
              <tr>
                <th style={{ textAlign: 'center' }}>خوب از</th>
                <th style={{ textAlign: 'center' }}>متوسط از</th>
                <th style={{ textAlign: 'center' }}>خوب از</th>
                <th style={{ textAlign: 'center' }}>متوسط از</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => {
                const current = subjectThresholds[subject.id];
                const update = (kind: 'percent' | 'score', field: 'good' | 'pass', raw: string) => {
                  const limit = kind === 'percent' ? 100 : SCORE_LIMIT;
                  const value = Math.min(Math.max(Number(raw) || 0, 0), limit);
                  setDraft((prev) => {
                    const current = prev[subject.id][kind];
                    const next =
                      field === 'pass'
                        ? { pass: value, good: Math.max(current.good, value) }
                        : { good: value, pass: Math.min(current.pass, value) };
                    return { ...prev, [subject.id]: { ...prev[subject.id], [kind]: next } };
                  });
                };
                const sample = current.percent.pass;
                return (
                  <tr key={subject.id}>
                    <td className="small bold">{subject.name}</td>
                    {(['percent', 'score'] as const).map((kind) => (
                      <Fragment key={kind}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            className="input num"
                            style={{ width: 62, height: 30, textAlign: 'center', padding: '0 4px' }}
                            value={current[kind].good}
                            onChange={(e) => update(kind, 'good', e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            className="input num"
                            style={{ width: 62, height: 30, textAlign: 'center', padding: '0 4px' }}
                            value={current[kind].pass}
                            onChange={(e) => update(kind, 'pass', e.target.value)}
                          />
                        </td>
                      </Fragment>
                    ))}
                    <td>
                      <Badge tone={sample >= current.percent.good ? 'green' : sample >= current.percent.pass ? 'amber' : 'red'}>
                        تستی {faPct(sample, 0)} →{' '}
                        {sample >= current.percent.good ? 'خوب' : sample >= current.percent.pass ? 'متوسط' : 'ضعیف'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row" style={{ gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
          <button
            className="btn primary"
            onClick={() => {
              setSubjectThresholds(subjectThresholds);
              setSavedNotice('ذخیره شد — روی همه‌ی رنگ‌ها و برچسب‌ها اعمال می‌شود.');
              window.setTimeout(() => setSavedNotice(''), 4000);
            }}
          >
            <Icon name="check" size={15} /> ذخیره‌ی مرزها
          </button>
          <button
            className="btn"
            onClick={() => {
              const defaults = defaultSubjectThresholds();
              setDraft(defaults);
              setSubjectThresholds(defaults);
              setSavedNotice('به مقدار پیش‌فرض برگشت.');
              window.setTimeout(() => setSavedNotice(''), 4000);
            }}
          >
            پیش‌فرض
          </button>
          {savedNotice && (
            <span className="small" style={{ color: '#0ca678' }}>
              {savedNotice}
            </span>
          )}
        </div>
      </Card>

      <div className="grid cols-2">
        {series.map((s) => {
          const t = thresholds[s.id];
          return (
            <Card
              key={s.id}
              title={
                <span className="row" style={{ gap: 8 }}>
                  <span className="dot" style={{ background: s.color }} />
                  {s.name}
                </span>
              }
              subtitle={`${s.kind === 'score' ? 'نمره‌ای' : 'درصدی'} · حداکثر نمره ${fa(
                s.maxScore,
              )} · ${s.templateNote}`}
            >
              <div className="row" style={{ marginBottom: 14 }}>
                <Badge tone={s.hasTemplate ? 'green' : 'amber'}>
                  {s.hasTemplate ? 'قالب PDF آماده' : 'قالب ندارد'}
                </Badge>
                <Badge line>{s.hasTemplate ? 'PDF متنی' : 'عکس / دستی'}</Badge>
                <div style={{ flex: 1 }} />
                <button className="btn sm">مدیریت قالب</button>
              </div>

              {(
                [
                  ['strong', 'مرز «قوی»'],
                  ['good', 'مرز «خوب»'],
                  ['pass', 'مرز قبولی'],
                ] as const
              ).map(([key, label]) => (
                <div className="stack" key={key} style={{ gap: 4, marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="tiny muted">{label}</span>
                    <span className="bold num small">{faPct(t[key], 0)}</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    step={5}
                    value={t[key]}
                    className="slider"
                    onChange={(e) =>
                      setThresholds((prev) => ({
                        ...prev,
                        [s.id]: { ...prev[s.id], [key]: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              ))}

              <div className="divider" />
              <div className="tiny muted" style={{ marginBottom: 6 }}>
                پیش‌نمایش سطح با مرزهای فعلی
              </div>
              <div className="row" style={{ gap: 6 }}>
                {[92, 78, 62, 41].map((value) => {
                  const p = preview(value, t);
                  return (
                    <Badge key={value} tone={p.tone}>
                      {fa(value)}٪ → {p.label}
                    </Badge>
                  );
                })}
              </div>
              <div className="tiny muted" style={{ marginTop: 10 }}>
                نمونه‌ی نمره: {faScore(17.5)} از {fa(20)} = {faPct(87.5)}
              </div>
            </Card>
          );
        })}
      </div>

      <Card
        title="دیتابیس و پشتیبان‌گیری"
        subtitle={
          online
            ? 'داده‌ی واقعی در یک فایل SQLite ذخیره می‌شود — فایل را کپی کنی، همه‌چیز با خودش می‌آید'
            : 'سرور بالا نیست؛ داده‌ها فقط در همین مرورگر ذخیره می‌شوند'
        }
        action={<Badge tone={online ? 'green' : 'amber'}>{online ? 'دیتابیس متصل' : 'حالت مرورگر'}</Badge>}
      >
        {online ? (
          <div className="grid cols-3">
            <div className="stack" style={{ gap: 4 }}>
              <div className="bold small">داده‌ی ذخیره‌شده</div>
              <div className="tiny muted">
                {fa(health?.counts.students ?? students.length)} دانش‌آموز ·{' '}
                {fa(health?.counts.scores ?? 0)} نمره · {fa(health?.counts.records ?? 0)} گزارش
              </div>
              <Badge line>{fa(health?.counts.exams ?? 0)} آزمون</Badge>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <div className="bold small">مسیر فایل دیتابیس</div>
              <div className="tiny muted" style={{ direction: 'ltr', textAlign: 'right', wordBreak: 'break-all' }}>
                {health?.database ?? 'data/meftah.db'}
              </div>
              <div className="tiny muted">برای انتقال، کل پوشه‌ی پروژه (همراه با همین فایل) را کپی کن.</div>
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <div className="bold small">پشتیبان‌گیری</div>
              <div className="tiny muted">هر بار یک نسخه‌ی کامل و سالم از دیتابیس</div>
              <button className="btn sm" onClick={() => { window.location.href = backupUrl(); }}>
                دریافت بکاپ
              </button>
            </div>
          </div>
        ) : (
          <div className="small" style={{ lineHeight: 2 }}>
            برای روشن کردن دیتابیس واقعی، در پوشه‌ی پروژه این دو دستور را اجرا کن و آدرس{' '}
            <span style={{ direction: 'ltr', display: 'inline-block' }}>http://localhost:3000</span> را باز کن:
            <pre
              style={{
                direction: 'ltr',
                textAlign: 'left',
                background: '#f6f8fc',
                border: '1px solid #e8ecf4',
                borderRadius: 10,
                padding: '10px 12px',
                marginTop: 8,
                fontSize: 12,
                overflowX: 'auto',
              }}
            >
              {'bun run build\nbun run start'}
            </pre>
            داده‌ها در <span style={{ direction: 'ltr', display: 'inline-block' }}>data/meftah.db</span> ذخیره
            می‌شوند؛ همین پوشه را روی VPS یا کامپیوتر مدرسه کپی کنی، همه‌ی داده‌ها با خودش می‌آید.
          </div>
        )}
      </Card>
    </div>
  );
}
