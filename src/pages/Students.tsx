import { useMemo, useState } from 'react';
import { classes, scores, series, students, trackShortLabels, type Student } from '../data/mock';
import { fa, faPct, faScore, initials } from '../lib/fa';
import { levelForStudentInSeries, scoreAverageForStudent, seriesPercentForStudent } from '../lib/stats';
import { appendSavedImports, removeSavedStudent } from '../lib/persist';
import { getRecords, replaceRecords } from '../lib/records';
import { setClassFilter, useClassFilter } from '../lib/classFilter';
import { Badge, Card, Icon, Modal, Progress } from '../components/ui';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** کد دانش‌آموزی: فقط رقم، فارسی/عربی هم قابل قبول */
function normalizeCode(input: string): string {
  const digits = Array.from(input)
    .map((char) => {
      const p = PERSIAN_DIGITS.indexOf(char);
      if (p >= 0) return String(p);
      const a = ARABIC_DIGITS.indexOf(char);
      return a >= 0 ? String(a) : char;
    })
    .join('')
    .replace(/\D/g, '');
  return digits.replace(/^0+/, '');
}

const emptyForm = () => ({ name: '', code: '', classId: classes[0]?.id ?? '', phone: '', guardian: '' });

export default function Students() {
  const [query, setQuery] = useState('');
  const classId = useClassFilter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  /* فهرست دانش‌آموزان بیرون از state است؛ با این شمارنده بعد از ثبت دوباره حساب می‌شود */
  const [dataVersion, setDataVersion] = useState(0);

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
  }, [query, classId, dataVersion]);

  const classOptions = classes;

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 6000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      code: student.code,
      classId: student.classId,
      phone: student.phone,
      guardian: student.guardian,
    });
    setFormError('');
    setOpen(true);
  };

  const saveStudent = () => {
    const name = form.name.trim().replace(/\s+/g, ' ');
    if (name.length < 3) {
      setFormError('نام و نام خانوادگی را کامل وارد کن.');
      return;
    }
    const targetClass = form.classId || classes[0]?.id;
    if (!targetClass) {
      setFormError('کلاسی انتخاب نشده است.');
      return;
    }
    const editing = editingId ? students.find((student) => student.id === editingId) : undefined;
    const used = new Set(
      students
        .filter((student) => student.id !== editing?.id)
        .map((student) => normalizeCode(student.code))
        .filter(Boolean),
    );
    let code = normalizeCode(form.code);
    if (code && used.has(code)) {
      setFormError('این کد دانش‌آموزی قبلاً ثبت شده است.');
      return;
    }
    if (!code) {
      if (editing) {
        code = editing.code;
      } else {
        let next = 900000 + students.length + 1;
        while (used.has(String(next))) next += 1;
        code = String(next);
      }
    }

    if (editing) {
      editing.name = name;
      editing.code = code;
      editing.classId = targetClass;
      editing.phone = form.phone.trim();
      editing.guardian = form.guardian.trim();
      setDataVersion((value) => value + 1);
      appendSavedImports({ students: [{ ...editing }], exams: [], scores: [] });
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      flash(`تغییرات ${name} ذخیره شد.`);
      return;
    }

    const student: Student = {
      id: `m-${Date.now().toString(36)}`,
      name,
      code,
      classId: targetClass,
      phone: form.phone.trim(),
      guardian: form.guardian.trim(),
      ability: 0.75,
      trend: 0,
      maz: true,
    };
    students.push(student);
    setDataVersion((value) => value + 1);
    /* همین‌جا در مرورگر ذخیره می‌شود و اگر سرور بالاست در دیتابیس هم می‌نشیند */
    appendSavedImports({ students: [student], exams: [], scores: [] });
    setForm(emptyForm());
    setFormError('');
    setOpen(false);
    flash(`${name} با کد ${fa(code)} به کلاس ${classes.find((c) => c.id === targetClass)?.name} اضافه شد.`);
  };

  const deleteStudent = (student: Student) => {
    const answer = window.confirm(
      `«${student.name}» و همه‌ی نمره‌ها و گزارش‌هایش حذف شود؟ این کار برگشت‌پذیر نیست.`,
    );
    if (!answer) return;
    const index = students.findIndex((item) => item.id === student.id);
    if (index >= 0) students.splice(index, 1);
    for (let i = scores.length - 1; i >= 0; i -= 1) {
      if (scores[i].studentId === student.id) scores.splice(i, 1);
    }
    replaceRecords(getRecords().filter((record) => record.studentId !== student.id));
    removeSavedStudent(student.id);
    setDataVersion((value) => value + 1);
    flash(`«${student.name}» حذف شد.`);
  };

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
          <button className={`chip${classId === 'all' ? ' active' : ''}`} onClick={() => setClassFilter('all')}>
            همه ({fa(students.length)})
          </button>
          {classes.map((c) => (
            <button
              key={c.id}
              className={`chip${classId === c.id ? ' active' : ''}`}
              onClick={() => setClassFilter(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn primary" onClick={openCreate}>
          <Icon name="plus" /> دانش‌آموز جدید
        </button>
      </div>

      {toast && <div className="alert info">{toast}</div>}

      {students.length === 0 && (
        <Card title="هنوز دانش‌آموزی ثبت نشده است">
          <div className="stack" style={{ gap: 10 }}>
            <div className="small" style={{ lineHeight: 2 }}>
              با آپلود فایل اکسل کارنامه، پروفایل‌ها از روی ستون نام ساخته می‌شوند؛ یا همین‌جا دستی اضافه کن.
            </div>
            <div className="row">
              <a className="btn primary" href="#/upload">
                آپلود اکسل
              </a>
              <button className="btn" onClick={openCreate}>
                دانش‌آموز جدید
              </button>
            </div>
          </div>
        </Card>
      )}

      {students.length > 0 && (
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
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn ghost sm" onClick={() => openEdit(student)}>
                        ویرایش
                      </button>
                      <button
                        className="btn ghost sm"
                        title="حذف دانش‌آموز"
                        aria-label={`حذف ${student.name}`}
                        onClick={() => deleteStudent(student)}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </div>
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
      )}

      <div className="alert info">
        <Icon name="alert" size={16} />
        <div>
          لیست دانش‌آموزان از خود فایل‌های اکسل هم ساخته می‌شود: در صفحه‌ی «آپلود اکسل»، هر نامی که
          پروفایل نداشته باشد هنگام تأیید پروفایل تازه می‌گیرد. ثبت دستی هم با دکمه‌ی «دانش‌آموز جدید»
          ممکن است و کد خالی خودکار و یکتا ساخته می‌شود.
        </div>
      </div>

      <Modal
        open={open}
        title={editingId ? 'ویرایش دانش‌آموز' : 'دانش‌آموز جدید'}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
          setFormError('');
        }}
        footer={
          <>
            <button className="btn primary" onClick={saveStudent}>
              {editingId ? 'ذخیره‌ی تغییرات' : 'ثبت دانش‌آموز'}
            </button>
            <button
              className="btn"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
                setFormError('');
              }}
            >
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
              placeholder="مثلاً زهرا محمدی"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="field">
            <label>کد دانش‌آموزی</label>
            <input
              className="input num"
              placeholder="خالی بگذاری خودکار ساخته می‌شود"
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </div>
          <div className="field">
            <label>کلاس</label>
            <select
              className="select"
              value={form.classId}
              onChange={(event) => setForm((prev) => ({ ...prev, classId: event.target.value }))}
            >
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {trackShortLabels[c.track]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>تلفن دانش‌آموز</label>
            <input
              className="input"
              placeholder="۰۹۱۲…"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
        </div>
        <div className="field">
          <label>تلفن ولی</label>
          <input
            className="input"
            placeholder="۰۹۱۲…"
            value={form.guardian}
            onChange={(event) => setForm((prev) => ({ ...prev, guardian: event.target.value }))}
          />
        </div>
        {formError && <div className="small" style={{ color: '#e03131' }}>{formError}</div>}
        <div className="tiny muted">
          فیلدهای سری‌ها ({series.map((s) => s.short).join(' / ')}) خودکار از کارنامه‌ها پر می‌شوند.
        </div>
      </Modal>
    </div>
  );
}
