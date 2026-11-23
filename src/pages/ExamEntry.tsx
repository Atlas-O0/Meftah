import { useState } from 'react';
import { classes, examById, scores, series, students, subjects } from '../data/mock';
import { fa, faDate, faPct, faScore } from '../lib/fa';
import { Badge, Card, Icon } from '../components/ui';

export default function ExamEntry({ id }: { id: string }) {
  const exam = examById(id);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (exam) {
      for (const score of scores.filter((s) => s.examId === exam.id)) {
        initial[`${score.studentId}:${score.subjectId}`] = String(score.value);
      }
    }
    return initial;
  });
  const [saved, setSaved] = useState(false);

  if (!exam) {
    return (
      <Card>
        <div className="empty">این آزمون پیدا نشد.</div>
      </Card>
    );
  }

  const seriesItem = series.find((s) => s.id === exam.seriesId)!;
  const classItem = classes.find((c) => c.id === exam.classId)!;
  const list = students.filter((s) => s.classId === exam.classId);

  const percentFor = (studentId: string) => {
    let sum = 0;
    let weightSum = 0;
    for (const subject of subjects) {
      const raw = Number(values[`${studentId}:${subject.id}`]);
      if (Number.isNaN(raw)) continue;
      sum += raw * subject.weight;
      weightSum += exam.maxScore * subject.weight;
    }
    return weightSum ? (sum / weightSum) * 100 : 0;
  };

  return (
    <div className="stack">
      <Card>
        <div className="row" style={{ gap: 14 }}>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h2>{exam.title}</h2>
              <Badge line>{seriesItem.name}</Badge>
              <Badge line>{exam.kind}</Badge>
            </div>
            <div className="small muted" style={{ marginTop: 4 }}>
              کلاس {classItem.name} · {faDate(exam.date)} · حداکثر نمره {fa(exam.maxScore)} ·{' '}
              {fa(list.length)} دانش‌آموز
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <a className="btn" href="#/exams">
            بازگشت
          </a>
          <button
            className="btn primary"
            onClick={() => {
              setSaved(true);
              window.setTimeout(() => setSaved(false), 3200);
            }}
          >
            <Icon name="check" /> ثبت نمره‌ها
          </button>
        </div>
      </Card>

      {saved && (
        <div className="alert success">
          <Icon name="check" size={16} />
          نسخه‌ی نمایشی: نمره‌ها ذخیره نشدند. در مرحله‌ی بعد در دیتابیس ثبت می‌شوند.
        </div>
      )}

      <Card
        title="جدول نمره‌ها"
        subtitle="با Tab یا Enter به خانه‌ی بعد برو — تغییرات همین‌جا محاسبه می‌شوند"
        flush
      >
        <div className="table-wrap">
          <table className="table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', right: 0, background: '#fbfcfe', zIndex: 2 }}>دانش‌آموز</th>
                {subjects.map((subject) => (
                  <th key={subject.id} style={{ minWidth: 74, textAlign: 'center' }}>
                    {subject.name}
                    <div className="tiny muted" style={{ fontWeight: 400 }}>
                      ضریب {fa(subject.weight)}
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>درصد</th>
              </tr>
            </thead>
            <tbody>
              {list.map((student) => {
                const percent = percentFor(student.id);
                return (
                  <tr key={student.id}>
                    <td
                      style={{
                        position: 'sticky',
                        right: 0,
                        background: '#fff',
                        zIndex: 2,
                        minWidth: 140,
                      }}
                      className="bold small"
                    >
                      {student.name}
                    </td>
                    {subjects.map((subject) => {
                      const key = `${student.id}:${subject.id}`;
                      const numeric = Number(values[key]);
                      return (
                        <td key={subject.id} style={{ padding: '6px 6px' }}>
                          <input
                            className="input num"
                            style={{
                              width: 62,
                              height: 32,
                              textAlign: 'center',
                              padding: '0 4px',
                              fontSize: 12.5,
                            }}
                            value={values[key] ?? ''}
                            onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder="—"
                          />
                          {!Number.isNaN(numeric) && numeric < exam.maxScore * 0.5 && (
                            <div className="tiny" style={{ color: '#f03e3e', textAlign: 'center' }}>
                              {faScore(numeric)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center' }}>
                      <Badge tone={percent >= 85 ? 'green' : percent >= 70 ? 'blue' : percent >= 50 ? 'amber' : 'red'}>
                        {faPct(percent, 0)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="alert">
        <Icon name="alert" size={16} />
        <div>
          این جدول همان جایی است که صفحه‌ی «بازبینی» بعد از خواندن PDF یا عکس هم از آن استفاده می‌کند؛
          فقط خانه‌های مشکوک از قبل رنگی می‌شوند.
        </div>
      </div>
    </div>
  );
}
