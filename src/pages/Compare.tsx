import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { classes, series, students, type SeriesId } from '../data/mock';
import { fa, faPct } from '../lib/fa';
import {
  classComparison,
  seriesPercentForClass,
  seriesPercentForSchool,
  seriesPercentForStudent,
  subjectPercents,
} from '../lib/stats';
import { Badge, Card, ChartTip, Progress, axisStyle, chartTicks } from '../components/ui';

export default function Compare() {
  const [seriesId, setSeriesId] = useState<SeriesId>('ghalamchi');
  const [studentId, setStudentId] = useState('s3');

  const seriesItem = series.find((s) => s.id === seriesId)!;
  const data = classComparison(seriesId);
  const school = seriesPercentForSchool(seriesId);
  const student = students.find((s) => s.id === studentId)!;
  const studentClass = classes.find((c) => c.id === student.classId)!;
  const own = seriesPercentForStudent(student.id, seriesId);
  const classAvg = seriesPercentForClass(student.classId, seriesId);
  const subjects = subjectPercents(student.id, seriesId);

  const compareData = [
    { name: student.name.split(' ')[0], percent: Number((own ?? 0).toFixed(1)), fill: seriesItem.color },
    { name: 'میانگین کلاس', percent: Number(classAvg.toFixed(1)), fill: '#94a3b8' },
    { name: 'میانگین مدرسه', percent: Number(school.toFixed(1)), fill: '#cbd5e1' },
  ];

  return (
    <div className="stack">
      <Card>
        <div className="row" style={{ gap: 14 }}>
          <div className="tabs">
            {series.map((s) => (
              <button
                key={s.id}
                className={`tab${seriesId === s.id ? ' active' : ''}`}
                onClick={() => setSeriesId(s.id)}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span className="tiny muted">
            همه‌ی مقایسه‌ها فقط داخل سری «{seriesItem.name}» معنی دارند.
          </span>
        </div>
      </Card>

      <div className="grid cols-2">
        <Card title="مقایسه‌ی کلاس‌ها" subtitle={`میانگین ${seriesItem.short} — دانش‌آموز به دانش‌آموز`}>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f7f9ff' }} />
                <Bar dataKey="percent" name="میانگین" radius={[7, 7, 0, 0]} barSize={20}>
                  {data.map((row, i) => (
                    <Cell key={row.name} fill={i === 0 ? '#c9d6ff' : seriesItem.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {classes.map((c) => {
              const p = seriesPercentForClass(c.id, seriesId);
              return (
                <div key={c.id} className="stack" style={{ gap: 4 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="small">{c.name}</span>
                    <span className="bold num small">{faPct(p)}</span>
                  </div>
                  <Progress value={p} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="دانش‌آموز در برابر کلاس و مدرسه"
          subtitle="یک نفر را انتخاب کن"
          action={
            <select
              className="select"
              style={{ width: 170, height: 34 }}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {classes.find((c) => c.id === s.classId)?.name}
                </option>
              ))}
            </select>
          }
        >
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[0, 100]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f7f9ff' }} />
                <Bar dataKey="percent" name="درصد" radius={[7, 7, 0, 0]} barSize={40}>
                  {compareData.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="row" style={{ marginTop: 10, gap: 8 }}>
            <Badge tone={(own ?? 0) >= classAvg ? 'green' : 'amber'}>
              {(own ?? 0) >= classAvg ? 'بالاتر از میانگین کلاس' : 'پایین‌تر از میانگین کلاس'}
            </Badge>
            <span className="tiny muted">
              {faPct(Math.abs((own ?? 0) - classAvg))} اختلاف با {studentClass.name}
            </span>
          </div>
        </Card>
      </div>

      <Card title="مقایسه‌ی درس‌به‌درس" subtitle={`${student.name} در ${seriesItem.short}`} flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>درس</th>
                <th>ضریب</th>
                <th>دانش‌آموز</th>
                <th>میانگین کلاس</th>
                <th>اختلاف</th>
                <th style={{ width: 180 }}>نمودار</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((row) => {
                const diff = row.percent - row.classPercent;
                return (
                  <tr key={row.subjectId}>
                    <td className="small bold">{row.name}</td>
                    <td className="tiny num muted">{fa(row.weight)}</td>
                    <td className="bold num small">{faPct(row.percent)}</td>
                    <td className="num small muted">{faPct(row.classPercent)}</td>
                    <td>
                      <span className="num small" style={{ color: diff >= 0 ? '#0ca678' : '#f03e3e' }}>
                        {diff >= 0 ? '+' : '−'}
                        {faPct(Math.abs(diff))}
                      </span>
                    </td>
                    <td>
                      <Progress value={row.percent} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
