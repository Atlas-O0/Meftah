import { useState } from 'react';
import { classes, series, students, subjects, type SeriesId } from '../data/mock';
import { fa, faPct, faScore } from '../lib/fa';
import { Badge, Card, Icon, Progress } from '../components/ui';

const teachers = [
  { name: 'خانم موسوی', role: 'مدیر و دبیر ریاضی', classes: '۱۲۱ · ۱۲۲' },
  { name: 'آقای رستمی', role: 'دبیر علوم', classes: '۱۲۳ · ۱۲۴' },
  { name: 'خانم کاظمی', role: 'دبیر ادبیات', classes: '۱۲۵ · ۱۲۶' },
];

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

  return (
    <div className="stack">
      <div className="grid cols-2">
        <Card title="کلاس‌ها" subtitle={`${fa(classes.length)} کلاس فعال — پایه دوازدهم`}>
          {classes.map((c) => (
            <div className="list-item" key={c.id}>
              <div className="avatar">{c.name.slice(-1)}</div>
              <div style={{ flex: 1 }}>
                <div className="bold small">{c.name}</div>
                <div className="tiny muted">
                  پایه {c.grade} · دبیر {c.teacher} ·{' '}
                  {fa(students.filter((s) => s.classId === c.id).length)} دانش‌آموز
                </div>
              </div>
              <Badge line>فعال</Badge>
            </div>
          ))}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm">
              <Icon name="plus" size={15} /> کلاس جدید
            </button>
          </div>
        </Card>

        <Card title="کاربران" subtitle="معلم‌ها با همین حساب‌ها وارد می‌شوند">
          {teachers.map((t) => (
            <div className="list-item" key={t.name}>
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
            </div>
          ))}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm">
              <Icon name="plus" size={15} /> معلم جدید
            </button>
          </div>
        </Card>
      </div>

      <Card title="دروس و ضریب‌ها" subtitle="میانگین‌ها وزنی محاسبه می‌شوند؛ ضریب هر درس اینجا تعیین می‌شود" flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>درس</th>
                <th>ضریب</th>
                <th style={{ width: 200 }}>وزن در میانگین</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="small bold">{s.name}</td>
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

      <Card title="پشتیبان‌گیری و شبکه" subtitle="در نسخه‌ی نهایی، همین‌جا آدرس شبکه و بکاپ قرار می‌گیرد">
        <div className="grid cols-3">
          <div className="stack" style={{ gap: 4 }}>
            <div className="bold small">آدرس شبکه</div>
            <div className="tiny muted" style={{ direction: 'ltr', textAlign: 'right' }}>
              http://192.168.1.50:3000
            </div>
            <Badge line>نمایشی</Badge>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <div className="bold small">پشتیبان‌گیری</div>
            <div className="tiny muted">دیتابیس و فایل‌ها در یک فایل zip</div>
            <button className="btn sm" disabled>
              دریافت بکاپ
            </button>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <div className="bold small">مسیر داده‌ها</div>
            <div className="tiny muted" style={{ direction: 'ltr', textAlign: 'right' }}>
              data/app.db · data/uploads/
            </div>
            <Badge line>در نسخه‌ی بعد</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
