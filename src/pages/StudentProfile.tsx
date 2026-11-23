import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  classes,
  disciplineNotes,
  scores,
  series,
  studentById,
  subjects,
  type NoteKind,
  type SeriesId,
} from '../data/mock';
import { fa, faDate, faPct, faScore, initials } from '../lib/fa';
import {
  examsForClassSeries,
  growthForStudent,
  levelForStudentInSeries,
  percentPointsForStudent,
  rankInExam,
  scorePointsForStudent,
  seriesPercentForClass,
  seriesPercentForStudent,
  seriesScoreForStudent,
  subjectPercents,
} from '../lib/stats';
import { Badge, Card, ChartTip, Icon, Modal, Progress, axisStyle, chartTicks } from '../components/ui';

const noteTone: Record<NoteKind, 'green' | 'amber' | 'red' | 'blue'> = {
  تشویق: 'green',
  تذکر: 'amber',
  غیبت: 'red',
  مشاوره: 'blue',
};

function toneOf(percent: number): string {
  if (percent >= 85) return '#0ca678';
  if (percent >= 70) return '#4c6ef5';
  if (percent >= 50) return '#e8940a';
  return '#f03e3e';
}

export default function StudentProfile({ id }: { id: string }) {
  const student = studentById(id);
  const [tab, setTab] = useState<SeriesId>('ghalamchi');
  const [notes, setNotes] = useState(disciplineNotes.filter((n) => n.studentId === id));
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteKind, setNoteKind] = useState<NoteKind>('تشویق');

  if (!student) {
    return (
      <Card>
        <div className="empty">این دانش‌آموز پیدا نشد.</div>
      </Card>
    );
  }

  const studentClass = classes.find((c) => c.id === student.classId)!;
  const seriesItem = series.find((s) => s.id === tab)!;
  const hasSeries = seriesPercentForStudent(student.id, tab) !== null;

  const growth = growthForStudent(student.id, tab);
  const overall = seriesPercentForStudent(student.id, tab);
  const scoreOverall = seriesScoreForStudent(student.id, tab);
  const classOverall = seriesPercentForClass(student.classId, tab);
  const level = levelForStudentInSeries(student.id, tab);
  const subjectRows = subjectPercents(student.id, tab);
  const classExams = examsForClassSeries(student.classId, tab);

  /* نمودار درصدی: قلمچی و ماز */
  const percentChart = percentPointsForStudent(student.id).map((point) => ({
    name: point.round > 1 ? `${point.seriesShort} ${fa(point.round)}` : point.seriesShort,
    student: Number(point.percent.toFixed(1)),
    classAvg: Number(point.classPercent.toFixed(1)),
    schoolAvg: Number(point.schoolPercent.toFixed(1)),
  }));

  /* نمودار نمره‌ای: کپسول، مستمرها و نوبت‌ها — از ۲۰ */
  const scoreChart = scorePointsForStudent(student.id).map((point) => ({
    name: point.round > 1 ? `${point.seriesShort} ${fa(point.round)}` : point.seriesShort,
    student: Number(point.value.toFixed(2)),
    classAvg: Number(point.classValue.toFixed(2)),
    schoolAvg: Number(point.schoolValue.toFixed(2)),
  }));

  const subjectData = subjectRows
    .map((row) => ({
      name: row.name,
      percent: Number(row.percent.toFixed(1)),
      classPercent: Number(row.classPercent.toFixed(1)),
    }))
    .sort((a, b) => b.percent - a.percent);

  const counts = {
    تشویق: notes.filter((n) => n.kind === 'تشویق').length,
    تذکر: notes.filter((n) => n.kind === 'تذکر').length,
    غیبت: notes.filter((n) => n.kind === 'غیبت').length,
    مشاوره: notes.filter((n) => n.kind === 'مشاوره').length,
  };

  return (
    <div className="stack">
      {/* هدر پروفایل */}
      <Card>
        <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <div className="avatar lg">{initials(student.name)}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="row" style={{ gap: 8 }}>
              <h1>{student.name}</h1>
              <Badge tone={level.tone as 'green' | 'blue' | 'amber' | 'red'}>{level.label}</Badge>
            </div>
            <div className="small muted" style={{ marginTop: 3 }}>
              کد {fa(student.code)} · کلاس {studentClass.name} · دبیر {studentClass.teacher}
            </div>
            <div className="row" style={{ gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {series.map((s) => {
                const p = seriesPercentForStudent(student.id, s.id);
                const raw = seriesScoreForStudent(student.id, s.id);
                if (p === null) {
                  return (
                    <div key={s.id} className="row" style={{ gap: 6 }}>
                      <span className="dot" style={{ background: s.color, opacity: 0.35 }} />
                      <span className="tiny muted">{s.short}</span>
                      <span className="tiny muted">ندارد</span>
                    </div>
                  );
                }
                return (
                  <div key={s.id} className="row" style={{ gap: 6 }}>
                    <span className="dot" style={{ background: s.color }} />
                    <span className="tiny muted">{s.short}</span>
                    <span className="bold num small">
                      {s.kind === 'score' ? `${faScore(raw ?? 0)} از ${fa(s.maxScore)}` : faPct(p)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="row no-print" style={{ gap: 8 }}>
            <button className="btn" onClick={() => window.print()}>
              <Icon name="print" /> چاپ کارنامه
            </button>
            <button className="btn" onClick={() => setNoteOpen(true)}>
              <Icon name="plus" /> مورد انضباطی
            </button>
          </div>
        </div>
      </Card>

      {/* نمودارهای کلی: یکی درصدی، یکی نمره‌ای */}
      <div className="grid cols-2">
        <Card
          title="نمودار درصدی"
          subtitle="قلمچی و ماز — درصد دانش‌آموز در برابر میانگین"
        >
          {percentChart.length === 0 ? (
            <div className="empty">نمره‌ی درصدی برای این دانش‌آموز ثبت نشده است.</div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={percentChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                    <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                    <YAxis domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                    <Tooltip content={<ChartTip />} />
                    <Line
                      type="monotone"
                      dataKey="student"
                      name="دانش‌آموز"
                      stroke="#4c6ef5"
                      strokeWidth={2.8}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="classAvg"
                      name="میانگین کلاس"
                      stroke="#98a2b3"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="schoolAvg"
                      name="میانگین مدرسه"
                      stroke="#d0d7e2"
                      strokeWidth={1.6}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row" style={{ marginTop: 8 }}>
                <span>
                  <i style={{ background: '#4c6ef5' }} /> دانش‌آموز
                </span>
                <span>
                  <i style={{ background: '#98a2b3' }} /> میانگین کلاس
                </span>
                <span>
                  <i style={{ background: '#d0d7e2' }} /> میانگین مدرسه
                </span>
              </div>
            </>
          )}
        </Card>

        <Card
          title="نمودار نمره‌ای"
          subtitle="کپسول، مستمرها و نوبت‌ها — نمره از ۲۰ در برابر میانگین"
        >
          {scoreChart.length === 0 ? (
            <div className="empty">نمره‌ی نمره‌ای برای این دانش‌آموز ثبت نشده است.</div>
          ) : (
            <>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                    <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                    <YAxis domain={[0, 20]} tick={chartTicks} {...axisStyle} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: '#f7f9ff' }} />
                    <Bar dataKey="student" name="دانش‌آموز" fill="#0ca678" radius={[6, 6, 0, 0]} barSize={16} />
                    <Bar dataKey="classAvg" name="میانگین کلاس" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row" style={{ marginTop: 8 }}>
                <span>
                  <i style={{ background: '#0ca678' }} /> دانش‌آموز
                </span>
                <span>
                  <i style={{ background: '#cbd5e1' }} /> میانگین کلاس
                </span>
                <span className="muted">اعداد از ۲۰</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* انتخاب سری */}
      <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="tabs">
          {series.map((s) => {
            const own = seriesPercentForStudent(student.id, s.id);
            return (
              <button
                key={s.id}
                className={`tab${tab === s.id ? ' active' : ''}`}
                onClick={() => setTab(s.id)}
              >
                {s.name}
                {s.optional && <span className="tiny muted"> · اختیاری</span>}
                {own === null && <span className="tiny muted"> (ندارد)</span>}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <span className="tiny muted">
          {seriesItem.kind === 'score' ? 'نمره‌ای از ۲۰' : 'درصدی از ۱۰۰'} ·{' '}
          {seriesItem.hasTemplate ? 'قالب آماده است' : 'قالب هنوز ساخته نشده'}
        </span>
      </div>

      {!hasSeries ? (
        <Card>
          <div className="empty">
            این دانش‌آموز در سری «{seriesItem.name}» نمره‌ای ندارد. این سری اختیاری است و همه‌ی
            دانش‌آموزها در آن شرکت نمی‌کنند.
          </div>
        </Card>
      ) : (
        <>
          {/* خلاصه‌ی سری انتخاب‌شده */}
          <Card>
            <div className="row" style={{ gap: 26, flexWrap: 'wrap' }}>
              <div className="stack" style={{ gap: 4, minWidth: 130 }}>
                <span className="tiny muted">میانگین دانش‌آموز</span>
                <span className="bold num" style={{ fontSize: 24 }}>
                  {seriesItem.kind === 'score'
                    ? `${faScore(scoreOverall ?? 0)} از ${fa(seriesItem.maxScore)}`
                    : faPct(overall)}
                </span>
              </div>
              <div className="stack" style={{ gap: 4, minWidth: 130 }}>
                <span className="tiny muted">میانگین کلاس</span>
                <span className="num" style={{ fontSize: 20 }}>
                  {faPct(classOverall)}
                </span>
              </div>
              <div className="stack" style={{ gap: 4, minWidth: 130 }}>
                <span className="tiny muted">تفاوت با کلاس</span>
                <span
                  className="bold num"
                  style={{ fontSize: 20, color: (overall ?? 0) >= classOverall ? '#0ca678' : '#f03e3e' }}
                >
                  {faPct(Math.abs((overall ?? 0) - classOverall))}
                  {(overall ?? 0) >= classOverall ? ' بالاتر' : ' پایین‌تر'}
                </span>
              </div>
              <div className="stack" style={{ gap: 6, flex: 1, minWidth: 180 }}>
                <span className="tiny muted">درصد پیشرفت نسبت به میانگین کلاس</span>
                <Progress value={overall ?? 0} color={toneOf(overall ?? 0)} />
                <span className="tiny muted">
                  سطح {level.label} · مرز قوی {fa(seriesItem.thresholds.strong)}٪ · مرز قبولی{' '}
                  {fa(seriesItem.thresholds.pass)}٪
                </span>
              </div>
            </div>
          </Card>

          {/* نمودار درسی + رشد همین سری */}
          <div className="grid cols-2">
            <Card
              title="نمودار درسی"
              subtitle={`درصد هر درس در ${seriesItem.short} — نمره‌ی وزنی همه‌ی آزمون‌ها`}
            >
              <div className="chart-wrap tall">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectData}
                    layout="vertical"
                    margin={{ top: 0, right: 26, left: 4, bottom: 0 }}
                    barCategoryGap={6}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={92}
                      tick={{ ...chartTicks, fontSize: 10.5 }}
                      {...axisStyle}
                    />
                    <Tooltip content={<ChartTip />} cursor={{ fill: '#f7f9ff' }} />
                    <Bar dataKey="percent" name="دانش‌آموز" radius={[0, 6, 6, 0]} barSize={11}>
                      {subjectData.map((row) => (
                        <Cell key={row.name} fill={toneOf(row.percent)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card
              title="روند همین سری"
              subtitle={`میانگین دانش‌آموز در ${fa(growth.length)} آزمون ${seriesItem.short} — در مقابل میانگین کلاس`}
            >
              <div className="chart-wrap tall">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={growth.map((point, index) => ({
                      name: growth.length > 1 ? `دور ${fa(index + 1)}` : point.title,
                      student: Number(point.percent.toFixed(1)),
                      classAvg: Number(point.classPercent.toFixed(1)),
                    }))}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                    <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                    <YAxis domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                    <Tooltip content={<ChartTip />} />
                    <ReferenceLine
                      y={Number(classOverall.toFixed(1))}
                      stroke="#adb5bd"
                      strokeDasharray="4 4"
                      label={{ value: 'میانگین کلاس', fontSize: 10, fill: '#8b95a9', position: 'insideTopLeft' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="student"
                      name="دانش‌آموز"
                      stroke={seriesItem.color}
                      strokeWidth={2.8}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="classAvg"
                      name="میانگین کلاس"
                      stroke="#98a2b3"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* کارنامه‌ها */}
          <div className="section-head">
            <h2>کارنامه‌های {seriesItem.short}</h2>
            <span className="tiny muted">هر آزمون یک کارت جدا — {fa(classExams.length)} آزمون</span>
            <div className="spacer" />
          </div>

          <div className="grid auto">
            {classExams.map((exam) => {
              const point = growth.find((g) => g.examId === exam.id);
              const rank = rankInExam(student.id, exam.id);
              const diff = (point?.percent ?? 0) - (point?.classPercent ?? 0);
              return (
                <div className="exam-card" key={exam.id}>
                  <div className="head">
                    <div style={{ flex: 1 }}>
                      <div className="bold small">{exam.title}</div>
                      <div className="tiny muted num">{faDate(exam.date)}</div>
                    </div>
                    <Badge tone={levelForPercent(point?.percent ?? 0).tone}>
                      {faPct(point?.percent ?? 0, 0)}
                    </Badge>
                  </div>
                  <div className="body">
                    {subjects.map((subject) => {
                      const score = scores.find(
                        (s) => s.studentId === student.id && s.examId === exam.id && s.subjectId === subject.id,
                      );
                      const p = score ? (score.value / exam.maxScore) * 100 : 0;
                      return (
                        <div className="score-row" key={subject.id}>
                          <span className="muted tiny">{subject.name}</span>
                          <span className={`s tiny${p < 50 ? ' low' : ''}`}>
                            {faScore(score?.value)} / {fa(exam.maxScore)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="divider" style={{ margin: '9px 0' }} />
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="tiny muted">
                        رتبه {fa(rank.rank)} از {fa(rank.total)}
                      </span>
                      <span className="tiny" style={{ color: diff >= 0 ? '#0ca678' : '#f03e3e' }}>
                        {diff >= 0 ? '+' : '−'}
                        {faPct(Math.abs(diff), 1)} نسبت به کلاس
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* انضباط */}
      <div className="grid cols-2">
        <Card
          title="گزارش انضباطی"
          subtitle={`${fa(notes.length)} مورد ثبت‌شده`}
          action={
            <button className="btn sm" onClick={() => setNoteOpen(true)}>
              <Icon name="plus" size={15} /> افزودن
            </button>
          }
        >
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <Badge tone="green">تشویق {fa(counts.تشویق)}</Badge>
            <Badge tone="amber">تذکر {fa(counts.تذکر)}</Badge>
            <Badge tone="red">غیبت {fa(counts.غیبت)}</Badge>
            <Badge tone="blue">مشاوره {fa(counts.مشاوره)}</Badge>
          </div>
          {notes.length === 0 ? (
            <div className="empty">موردی ثبت نشده است.</div>
          ) : (
            <div className="stack" style={{ gap: 0 }}>
              {notes.map((note) => (
                <div className="list-item" key={note.id} style={{ alignItems: 'flex-start' }}>
                  <Badge tone={noteTone[note.kind]}>{note.kind}</Badge>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="small">{note.text}</div>
                    <div className="tiny muted num">
                      {faDate(note.date)} · {note.by}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="وضعیت درسی" subtitle="قوی‌ترین و ضعیف‌ترین درس‌ها">
          <div className="stack" style={{ gap: 12 }}>
            {subjectData.slice(0, 3).map((row) => (
              <div key={row.name} className="stack" style={{ gap: 5 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{row.name}</span>
                  <span className="bold num small">{faPct(row.percent, 0)}</span>
                </div>
                <Progress value={row.percent} />
              </div>
            ))}
            <div className="divider" style={{ margin: '4px 0' }} />
            <div className="tiny muted">نیازمند تقویت</div>
            {subjectData.slice(-3).reverse().map((row) => (
              <div key={row.name} className="stack" style={{ gap: 5 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{row.name}</span>
                  <span className="bold num small" style={{ color: '#f03e3e' }}>
                    {faPct(row.percent, 0)}
                  </span>
                </div>
                <Progress value={row.percent} color="#f03e3e" />
              </div>
            ))}
            <div className="alert info">
              <Icon name="alert" size={16} />
              <div>
                فقط نمره‌های سری «{seriesItem.name}» در این محاسبه داخل می‌شوند؛ سری‌های دیگر با هم
                جمع نمی‌شوند.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={noteOpen}
        title="افزودن مورد انضباطی"
        onClose={() => setNoteOpen(false)}
        footer={
          <>
            <button
              className="btn primary"
              onClick={() => {
                setNotes((prev) => [
                  {
                    id: `local-${Date.now()}`,
                    studentId: student.id,
                    date: '1404-12-15',
                    kind: noteKind,
                    text: noteText || 'بدون توضیح',
                    by: 'خانم موسوی',
                  },
                  ...prev,
                ]);
                setNoteText('');
                setNoteOpen(false);
              }}
            >
              ثبت مورد
            </button>
            <button className="btn" onClick={() => setNoteOpen(false)}>
              انصراف
            </button>
          </>
        }
      >
        <div className="field">
          <label>نوع مورد</label>
          <select className="select" value={noteKind} onChange={(e) => setNoteKind(e.target.value as NoteKind)}>
            {(Object.keys(noteTone) as NoteKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>توضیح</label>
          <textarea
            className="input"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="مثلاً همکاری خوب در کار گروهی"
          />
        </div>
        <div className="tiny muted">این مورد فقط تا رفرش صفحه می‌ماند؛ در نسخه‌ی بعدی ذخیره می‌شود.</div>
      </Modal>
    </div>
  );

  function levelForPercent(percent: number) {
    if (percent >= 85) return { tone: 'green' as const };
    if (percent >= 70) return { tone: 'blue' as const };
    if (percent >= 50) return { tone: 'amber' as const };
    return { tone: 'red' as const };
  }
}
