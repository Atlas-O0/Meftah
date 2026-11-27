import { useState } from 'react';
import {
  classes,
  currentUser,
  recordCategories,
  recordKinds,
  students,
  type RecordCategory,
  type RecordKind,
} from '../data/mock';
import { fa, faDate, initials } from '../lib/fa';
import { todayJalali } from '../lib/jalali';
import {
  addRecord,
  categoryTone,
  kindTone,
  removeRecord,
  useRecords,
} from '../lib/records';
import { Badge, Card, Icon, Modal, StatCard } from '../components/ui';
import { useClassFilter } from '../lib/classFilter';

export default function Records() {
  const records = useRecords();
  const [category, setCategory] = useState<'all' | RecordCategory>('all');
  const classId = useClassFilter();
  const [kind, setKind] = useState<'all' | RecordKind>('all');
  const [open, setOpen] = useState(false);

  const [formStudent, setFormStudent] = useState('s1');
  const [formCategory, setFormCategory] = useState<RecordCategory>('انضباطی');
  const [formKind, setFormKind] = useState<RecordKind>('تشویق');
  const [formDate, setFormDate] = useState(todayJalali());
  const [formText, setFormText] = useState('');

  const studentOf = (id: string) => students.find((s) => s.id === id);
  const classOf = (id: string) => classes.find((c) => c.id === studentOf(id)?.classId);

  const rows = records
    .filter((record) => (category === 'all' ? true : record.category === category))
    .filter((record) => (kind === 'all' ? true : record.kind === kind))
    .filter((record) => (classId === 'all' ? true : studentOf(record.studentId)?.classId === classId))
    .sort((left, right) => right.date.localeCompare(left.date));

  const countOf = (target: RecordCategory) => records.filter((r) => r.category === target).length;

  return (
    <div className="stack">
      <div className="grid stats">
        {recordCategories.map((item) => (
          <StatCard
            key={item}
            label={`گزارش ${item}`}
            value={fa(countOf(item))}
            foot="ثبت‌شده برای دانش‌آموزان"
            icon={item === 'انضباطی' ? 'alert' : item === 'فرهنگی' ? 'users' : 'exams'}
          />
        ))}
      </div>

      <Card>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="chip-row">
            <button
              className={`chip${category === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              همه ({fa(records.length)})
            </button>
            {recordCategories.map((item) => (
              <button
                key={item}
                className={`chip${category === item ? ' active' : ''}`}
                onClick={() => setCategory(item)}
              >
                {item} ({fa(countOf(item))})
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <select
            className="select"
            style={{ width: 130, height: 34 }}
            value={kind}
            onChange={(e) => setKind(e.target.value as 'all' | RecordKind)}
            aria-label="فیلتر نوع"
          >
            <option value="all">همه‌ی انواع</option>
            {recordKinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={() => setOpen(true)}>
            <Icon name="plus" /> گزارش جدید
          </button>
        </div>
      </Card>

      <Card
        title="گزارش‌های ثبت‌شده"
        subtitle="انضباطی · فرهنگی · پژوهشی · ورزشی — برای هر دانش‌آموز"
        flush
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>دانش‌آموز</th>
                <th>کلاس</th>
                <th>دسته</th>
                <th>نوع</th>
                <th>توضیح</th>
                <th>تاریخ</th>
                <th>ثبت‌کننده</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const student = studentOf(record.studentId);
                const cls = classOf(record.studentId);
                return (
                  <tr key={record.id}>
                    <td>
                      <a
                        href={`#/students/${record.studentId}`}
                        className="row"
                        style={{ gap: 9, color: 'inherit', textDecoration: 'none' }}
                      >
                        <div className="avatar">{initials(student?.name ?? '—')}</div>
                        <span className="bold small">{student?.name ?? 'دانش‌آموز حذف‌شده'}</span>
                      </a>
                    </td>
                    <td className="small">{cls?.name ?? '—'}</td>
                    <td>
                      <Badge tone={categoryTone[record.category]}>{record.category}</Badge>
                    </td>
                    <td>
                      <Badge tone={kindTone[record.kind]}>{record.kind}</Badge>
                    </td>
                    <td className="small" style={{ minWidth: 220 }}>
                      {record.text}
                    </td>
                    <td className="tiny num muted">{faDate(record.date)}</td>
                    <td className="tiny muted">{record.by}</td>
                    <td>
                      <button
                        className="btn ghost sm"
                        title="حذف این گزارش"
                        onClick={() => removeRecord(record.id)}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">برای این فیلتر گزارشی ثبت نشده است.</div>
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
          هر گزارش بلافاصله در پروفایل همان دانش‌آموز دیده می‌شود و در دیتابیس ذخیره می‌شود؛ در حالت
          بدون سرور هم در همین مرورگر می‌ماند.
        </div>
      </div>

      <Modal
        open={open}
        title="ثبت گزارش جدید"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              className="btn primary"
              onClick={() => {
                addRecord({
                  studentId: formStudent,
                  category: formCategory,
                  kind: formKind,
                  date: formDate || todayJalali(),
                  text: formText || 'بدون توضیح',
                  by: currentUser.name,
                });
                setFormText('');
                setOpen(false);
              }}
            >
              ثبت گزارش
            </button>
            <button className="btn" onClick={() => setOpen(false)}>
              انصراف
            </button>
          </>
        }
      >
        <div className="grid cols-2">
          <div className="field">
            <label>دانش‌آموز</label>
            <select
              className="select"
              value={formStudent}
              onChange={(e) => setFormStudent(e.target.value)}
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} — {classes.find((c) => c.id === student.classId)?.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>دسته</label>
            <select
              className="select"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as RecordCategory)}
            >
              {recordCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>نوع</label>
            <select
              className="select"
              value={formKind}
              onChange={(e) => setFormKind(e.target.value as RecordKind)}
            >
              {recordKinds.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>تاریخ (شمسی)</label>
            <input
              className="input num"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              placeholder="۱۴۰۵-۰۹-۰۳"
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </div>
        </div>
        <div className="field">
          <label>توضیح</label>
          <textarea
            className="input"
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
            placeholder="مثلاً مقام اول مسابقات قرآن منطقه"
          />
        </div>
      </Modal>
    </div>
  );
}
