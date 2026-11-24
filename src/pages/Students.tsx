import { useMemo, useState } from 'react';
import { classes, series, students, trackShortLabels } from '../data/mock';
import { fa, faPct, faScore, initials } from '../lib/fa';
import { levelForStudentInSeries, scoreAverageForStudent, seriesPercentForStudent } from '../lib/stats';
import { Badge, Card, Icon, Modal, Progress } from '../components/ui';

export default function Students() {
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');

  const rows = useMemo(() => {
    return students
      .filter((s) => (classId === 'all' ? true : s.classId === classId))
      .filter((s) => s.name.includes(query.trim()) || s.code.includes(query.trim()))
      .map((s) => ({
        student: s,
        track: classes.find((c) => c.id === s.classId)!.track,
        ghalamchi: seriesPercentForStudent(s.id, 'ghalamchi'),
        score: scoreAverageForStudent(s.id),
        level: levelForStudentInSeries(s.id, 'ghalamchi'),
      }));
  }, [query, classId]);

  return (
    <div className="stack">
      <div className="row">
        <div className="search">
          <Icon name="search" />
          <input
            className="input"
            placeholder="جستجوی نام یا کد دانش‌آموزی…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="chip-row">
          <button className={`chip${classId === 'all' ? ' active' : ''}`} onClick={() => setClassId('all')}>
            همه ({fa(students.length)})
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              className={`chip${classId === c.id ? ' active' : ''}`}
              onClick={() => setClassId(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn primary" onClick={() => setOpen(true)}>
          <Icon name="plus" /> دانش‌آموز جدید
        </button>
      </div>

      {toast && <div className="alert info">{toast}</div>}

      <Card flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>دانش‌آموز</th>
                <th>کد</th>
                <th>کلاس</th>
                <th>میانگین قلمچی</th>
                <th>میانگین نمره‌ای‌ها</th>
                <th>سطح</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, track, ghalamchi, score, level }) => (
                <tr
                  key={student.id}
                  className="clickable"
                  onClick={() => {
                    window.location.hash = `/students/${student.id}`;
                  }}
                >
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <div className="avatar">{initials(student.name)}</div>
                      <div className="row" style={{ gap: 6 }}>
                        <Badge tone={track === 'math' ? 'blue' : 'green'}>{trackShortLabels[track]}</Badge>
                        <span className="bold small">{student.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="num tiny muted">{fa(student.code)}</td>
                  <td className="small">{classes.find((c) => c.id === student.classId)?.name}</td>
                  <td style={{ minWidth: 130 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="bold num small" style={{ width: 40 }}>
                        {faPct(ghalamchi, 0)}
                      </span>
                      <div style={{ width: 70 }}>
                        <Progress value={ghalamchi ?? 0} color="#4c6ef5" />
                      </div>
                    </div>
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="bold num small" style={{ width: 52 }}>
                        {score === null ? '—' : `${faScore(score)}/${fa(20)}`}
                      </span>
                      <div style={{ width: 70 }}>
                        <Progress value={score === null ? 0 : (score / 20) * 100} color="#0ca678" />
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={level.tone as 'green' | 'blue' | 'amber' | 'red'}>{level.label}</Badge>
                  </td>
                  <td className="tiny muted">
                    <Icon name="arrow" size={16} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">دانش‌آموزی با این مشخصات پیدا نشد.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="alert info">
        <Icon name="alert" size={16} />
        <div>
          در این نسخه‌ی نمایشی فرم «دانش‌آموز جدید» چیزی ذخیره نمی‌کند. در مرحله‌ی بعد، همین فرم در
          دیتابیس SQLite ثبت می‌شود و کد دانش‌آموزی یکتا ساخته می‌شود.
        </div>
      </div>

      <Modal
        open={open}
        title="دانش‌آموز جدید"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              className="btn primary"
              onClick={() => {
                setOpen(false);
                setToast('نمایشی: اطلاعات ثبت نشد. در نسخه‌ی بعدی در دیتابیس ذخیره می‌شود.');
              }}
            >
              ثبت دانش‌آموز
            </button>
            <button className="btn" onClick={() => setOpen(false)}>
              انصراف
            </button>
          </>
        }
      >
        <div className="grid cols-2">
          <div className="field">
            <label>نام و نام خانوادگی</label>
            <input className="input" placeholder="مثلاً زهرا محمدی" />
          </div>
          <div className="field">
            <label>کد دانش‌آموزی</label>
            <input className="input" placeholder="۴۰۲۵" />
          </div>
          <div className="field">
            <label>کلاس</label>
            <select className="select">
              {classes.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>تلفن ولی</label>
            <input className="input" placeholder="۰۹۱۲…" />
          </div>
        </div>
        <div className="field">
          <label>یادداشت</label>
          <textarea className="input" placeholder="توضیح اختیاری" />
        </div>
        <div className="tiny muted">
          فیلدهای سری‌ها ({series.map((s) => s.short).join(' / ')}) خودکار از کارنامه‌ها پر می‌شوند.
        </div>
      </Modal>
    </div>
  );
}
