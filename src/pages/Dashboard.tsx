import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { classes, exams, imports, series, students } from '../data/mock';
import { fa, faDate, faPct, faScore } from '../lib/fa';
import {
  classComparison,
  needsAttention,
  scoreAverageForSchool,
  seriesPercentForSchool,
  seriesScoreForSchool,
  seriesTrend,
  studentLabel,
} from '../lib/stats';
import { Badge, Card, ChartTip, Progress, StatCard, axisStyle, chartTicks } from '../components/ui';

export default function Dashboard() {
  const classData = classComparison('ghalamchi');
  const ghalamchiTrend = seriesTrend('ghalamchi');
  const mazTrend = seriesTrend('maz');
  const moshavereTrend = seriesTrend('moshavere');
  const trendData = ghalamchiTrend.map((row, i) => ({
    name: row.name,
    ghalamchi: row.percent,
    maz: mazTrend[i]?.percent ?? null,
    moshavere: moshavereTrend[i]?.percent ?? null,
  }));

  const attention = needsAttention(5);
  const scoreAvg = scoreAverageForSchool();

  return (
    <div className="stack">
      <div className="grid stats">
        <StatCard
          label="دانش‌آموزان"
          value={fa(students.length)}
          foot={`در ${fa(classes.length)} کلاس فعال`}
          icon="users"
        />
        <StatCard
          label="آزمون‌های ثبت‌شده"
          value={fa(exams.length)}
          foot={`${fa(series.length)} سری جدا · درصدی و نمره‌ای`}
          icon="exams"
        />
        <StatCard
          label="میانگین قلمچی"
          value={faPct(seriesPercentForSchool('ghalamchi'))}
          foot="درصدی — همه‌ی کلاس‌ها"
          icon="compare"
          tone="#4c6ef5"
        />
        <StatCard
          label="میانگین نمره‌ای‌ها"
          value={`${faScore(scoreAvg)} از ${fa(20)}`}
          foot="کپسول، مستمرها و نوبت‌ها"
          icon="dashboard"
          tone="#0ca678"
        />
      </div>

      <div className="grid cols-2">
        <Card title="میانگین قلمچی هر کلاس" subtitle="درصدی — هر کلاس جدا حساب می‌شود">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f7f9ff' }} />
                <Bar dataKey="percent" name="قلمچی" fill="#4c6ef5" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="روند آزمون‌های تستی" subtitle="قلمچی چهار دور · ماز دو دور (اختیاری) · مشاوره دو دور">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[30, 100]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ChartTip />} />
                <Line
                  type="monotone"
                  dataKey="ghalamchi"
                  name="قلمچی"
                  stroke="#4c6ef5"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="maz"
                  name="ماز"
                  stroke="#7048e8"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="moshavere"
                  name="مشاوره"
                  stroke="#1c7ed6"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-row" style={{ marginTop: 8 }}>
            <span>
              <i style={{ background: '#4c6ef5' }} /> قلمچی
            </span>
            <span>
              <i style={{ background: '#7048e8' }} /> ماز
            </span>
            <span>
              <i style={{ background: '#1c7ed6' }} /> مشاوره
            </span>
          </div>
        </Card>
      </div>

      <div className="grid cols-2">
        <Card
          title="نیازمند توجه"
          subtitle="بر اساس قلمچی — پایین‌ترین میانگین‌ها"
          action={
            <a className="btn ghost sm" href="#/students">
              همه‌ی دانش‌آموزان
            </a>
          }
        >
          {attention.length === 0 ? (
            <div className="empty">دانش‌آموزی در وضعیت نیازمند توجه نیست.</div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {attention.map(({ student, percent }) => {
                const label = studentLabel(student.id);
                return (
                  <a
                    key={student.id}
                    href={`#/students/${student.id}`}
                    className="list-item"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="avatar">{student.name.slice(0, 1)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row" style={{ gap: 6 }}>
                        <span className="bold small">{student.name}</span>
                        <span className="tiny muted">{label.className}</span>
                      </div>
                      <div style={{ marginTop: 5 }}>
                        <Progress value={percent ?? 0} />
                      </div>
                    </div>
                    <div className="stack" style={{ alignItems: 'flex-end', gap: 2 }}>
                      <span className="bold num small">{faPct(percent)}</span>
                      <Badge tone="red">نیازمند توجه</Badge>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="آخرین آپلود کارنامه‌ها" subtitle="هر آپلود قابل بازبینی و برگشت است" flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>فایل</th>
                  <th>سری</th>
                  <th>روش</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="bold tiny" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {item.fileName}
                      </div>
                      <div className="tiny muted">{fa(item.rows)} سطر</div>
                    </td>
                    <td>
                      <Badge line>{series.find((s) => s.id === item.seriesId)?.short}</Badge>
                    </td>
                    <td className="tiny">{item.method}</td>
                    <td>
                      <Badge tone={item.status === 'ثبت شد' ? 'green' : 'amber'}>{item.status}</Badge>
                    </td>
                    <td className="tiny num muted">{faDate(item.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="خلاصه‌ی سری‌ها" subtitle="درصدی‌ها با درصد، نمره‌ای‌ها با نمره از ۲۰" flush>
        <div className="grid auto" style={{ padding: 16 }}>
          {series.map((s) => {
            const pct = seriesPercentForSchool(s.id);
            const raw = s.kind === 'score' ? seriesScoreForSchool(s.id) : null;
            return (
              <div key={s.id} className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 8 }}>
                  <span className="dot" style={{ background: s.color }} />
                  <span className="bold small">{s.name}</span>
                  <span className="tiny muted">{s.kind === 'score' ? 'از ۲۰' : 'درصدی'}</span>
                  {s.optional && <Badge line>اختیاری</Badge>}
                </div>
                <div className="stack" style={{ gap: 6 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="tiny muted">میانگین مدرسه</span>
                    <span className="bold num small">
                      {raw !== null ? `${faScore(raw)} از ${fa(20)}` : faPct(pct)}
                    </span>
                  </div>
                  <Progress value={pct} color={s.color} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
