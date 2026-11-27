import { useState } from 'react';
import { classes, examById, scores, series, students, subjectsForClassSeries } from '../data/mock';
import { fa, faDate, faPct, faScore } from '../lib/fa';
import { saveExamScores, type SaveScoresResult } from '../lib/scores';
import { subjectLevel, thresholdsFor } from '../lib/thresholds';
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
  const [result, setResult] = useState<SaveScoresResult | null>(null);

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
  const examSubjects = subjectsForClassSeries(exam.classId, exam.seriesId);

  const percentFor = (studentId: string) => {
    let sum = 0;
    let weightSum = 0;
    for (const subject of examSubjects) {
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
              const saved = saveExamScores(exam.id, values);
              setResult(saved);
              if (saved.written > 0) {
                setValues((prev) => {
                  const next = { ...prev };
                  for (const [key, value] of Object.entries(saved.values)) next[key] = String(value);
                  return next;
                });
              }
            }}
          >
            <Icon name="check" /> ثبت نمره‌ها
          </button>
        </div>
      </Card>

      {result && result.written > 0 && (
        <div className="alert success">
          <Icon name="check" size={16} />
          <div>
            {fa(result.written)} نمره ذخیره شد و در پروفایل دانش‌آموزان و نمودار سری «{seriesItem.name}» دیده می‌شود.
            {result.empty > 0 && <> {fa(result.empty)} خانه خالی مانده است.</>}
            {result.invalid > 0 && (
              <span style={{ color: '#e03131' }}> {fa(result.invalid)} عدد بی‌اعتبار بود (بیشتر از {fa(exam.maxScore)}).</span>
            )}
          </div>
        </div>
      )}

      {result && result.written === 0 && (
        <div className="alert info">
          <Icon name="alert" size={16} />
          <div>هنوز نمره‌ای پر نشده است؛ خانه‌ها را پر کن و دوباره ثبت بزن.</div>
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
                {examSubjects.map((subject) => {
                  const border = thresholdsFor(subject.id, seriesItem.kind);
                  return (
                    <th key={subject.id} style={{ minWidth: 74, textAlign: 'center' }}>
                      {subject.name}
                      <div className="tiny muted" style={{ fontWeight: 400 }}>
                        ضریب {fa(subject.weight)} · متوسط از{' '}
                        {seriesItem.kind === 'percent' ? `${fa(border.pass)}٪` : faScore(border.pass)}
                      </div>
                    </th>
                  );
                })}
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
                    {examSubjects.map((subject) => {
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
                          {!Number.isNaN(numeric) && values[key] !== '' && (
                            (() => {
                              const level = subjectLevel(numeric, exam.maxScore, subject.id, seriesItem.kind);
                              if (level.tone === 'green') return null;
                              return (
                                <div
                                  className="tiny"
                                  style={{ color: level.tone === 'red' ? '#f03e3e' : '#f59f00', textAlign: 'center' }}
                                >
                                  {level.tone === 'red' ? 'زیر متوسط' : 'متوسط'}
                                </div>
                              );
                            })()
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
          نمره‌ها با کلید «دانش‌آموز + آزمون + درس» ذخیره می‌شوند؛ ثبت دوباره همان عدد را به‌روز می‌کند، نه
          تکراری. با سرور در دیتابیس ذخیره می‌شوند و بدون سرور در همین مرورگر می‌مانند و با رفرش پاک نمی‌شوند.
        </div>
      </div>
    </div>
  );
}
