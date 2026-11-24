import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  classes,
  orderedSeries,
  series,
  students,
  subjectsSharedByClassIds,
  trackLabels,
  type SeriesId,
} from '../data/mock';
import { fa, faPct, faScore } from '../lib/fa';
import {
  scaleOf,
  seriesValueForClass,
  seriesValueForSchool,
  seriesValueForStudent,
  subjectPercentForClass,
  subjectPercents,
  toScale,
} from '../lib/stats';
import { Badge, Card, Progress, axisStyle, chartTicks } from '../components/ui';

function ValueTip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      dir="rtl"
      style={{
        background: '#fff',
        border: '1px solid #e8ecf4',
        borderRadius: 10,
        boxShadow: '0 12px 30px -18px rgba(20,30,60,.35)',
        padding: '8px 10px',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
          <span style={{ color: '#8b95a9' }}>{entry.name}:</span>
          <span style={{ fontWeight: 700 }}>{format(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

const studentOption = (id: string) => {
  const student = students.find((s) => s.id === id)!;
  const cls = classes.find((c) => c.id === student.classId)!;
  return `${student.name} — ${cls.name} (${trackLabels[cls.track]})`;
};

export default function Compare() {
  const [seriesId, setSeriesId] = useState<SeriesId>('ghalamchi');
  const [studentA, setStudentA] = useState('s1');
  const [studentB, setStudentB] = useState('s7');
  const [classA, setClassA] = useState('c121');
  const [classB, setClassB] = useState('c123');

  const seriesItem = series.find((s) => s.id === seriesId)!;
  const isPercent = seriesItem.kind === 'percent';
  const scale = scaleOf(seriesId);

  const fmt = (value: number | null | undefined) =>
    isPercent ? faPct(value ?? 0) : `${faScore(value ?? 0)} از ${fa(seriesItem.maxScore)}`;
  const short = (value: number) => (isPercent ? faPct(value, 0) : faScore(value));

  const schoolValue = seriesValueForSchool(seriesId);

  /* ---------- دانش‌آموز با دانش‌آموز ---------- */
  const a = students.find((s) => s.id === studentA) ?? students[0];
  const b = students.find((s) => s.id === studentB) ?? students[1] ?? a;

  if (!a) {
    return (
      <Card>
        <div className="empty">
          برای مقایسه‌ی دانش‌آموزها باید اول حداقل یک دانش‌آموز ثبت شده باشد. از صفحه‌ی «آپلود کارنامه»
          یا «دانش‌آموزان» شروع کن.
        </div>
      </Card>
    );
  }

  const aClass = classes.find((c) => c.id === a.classId)!;
  const bClass = classes.find((c) => c.id === b.classId)!;
  const aValue = seriesValueForStudent(a.id, seriesId);
  const bValue = seriesValueForStudent(b.id, seriesId);
  const aClassValue = seriesValueForClass(a.classId, seriesId);
  const aSubjects = subjectPercents(a.id, seriesId);
  const bSubjects = subjectPercents(b.id, seriesId);

  const studentChart = [
    { name: a.name.split(' ')[0], value: Number(toScale(aValue ?? 0, seriesId).toFixed(2)), fill: seriesItem.color },
    { name: b.name.split(' ')[0], value: Number(toScale(bValue ?? 0, seriesId).toFixed(2)), fill: '#f59f00' },
    { name: 'میانگین ' + aClass.name, value: Number(aClassValue.toFixed(2)), fill: '#94a3b8' },
    { name: 'میانگین مدرسه', value: Number(schoolValue.toFixed(2)), fill: '#cbd5e1' },
  ];

  const crossTrackStudents = aClass.track !== bClass.track;
  const studentSubjects = subjectsSharedByClassIds([a.classId, b.classId], seriesId);
  const subjectCompare = studentSubjects.map((subject) => {
    const rowA = aSubjects.find((row) => row.subjectId === subject.id);
    const rowB = bSubjects.find((row) => row.subjectId === subject.id);
    return {
      name: subject.name,
      a: Number(toScale(rowA?.percent ?? 0, seriesId).toFixed(2)),
      b: Number(toScale(rowB?.percent ?? 0, seriesId).toFixed(2)),
      weight: subject.weight,
    };
  });

  /* ---------- کلاس به کلاس ---------- */
  const classItemA = classes.find((c) => c.id === classA)!;
  const classItemB = classes.find((c) => c.id === classB)!;
  const classValueA = seriesValueForClass(classA, seriesId);
  const classValueB = seriesValueForClass(classB, seriesId);

  const classChart = [
    { name: classItemA.name, value: Number(classValueA.toFixed(2)), fill: seriesItem.color },
    { name: classItemB.name, value: Number(classValueB.toFixed(2)), fill: '#f59f00' },
    { name: 'میانگین مدرسه', value: Number(schoolValue.toFixed(2)), fill: '#cbd5e1' },
  ];

  const crossTrackClasses = classItemA.track !== classItemB.track;
  const classSubjectCompare = subjectsSharedByClassIds([classA, classB], seriesId).map((subject) => ({
    name: subject.name,
    a: Number(toScale(subjectPercentForClass(classA, subject.id, seriesId), seriesId).toFixed(2)),
    b: Number(toScale(subjectPercentForClass(classB, subject.id, seriesId), seriesId).toFixed(2)),
    weight: subject.weight,
  }));

  /* ---------- میانگین کلاس‌ها ---------- */
  const classAverages = classes
    .map((cls) => ({
      id: cls.id,
      name: cls.name,
      value: Number(seriesValueForClass(cls.id, seriesId).toFixed(2)),
      count: students.filter((s) => s.classId === cls.id).length,
    }))
    .sort((left, right) => right.value - left.value);

  const bestClass = classAverages[0];
  const worstClass = classAverages[classAverages.length - 1];

  return (
    <div className="stack">
      <Card>
        <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
          <div className="tabs">
            {orderedSeries.map((s) => (
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
            {isPercent
              ? 'درصدی — مقایسه‌ها از ۱۰۰'
              : `نمره‌ای — مقایسه‌ها از ${fa(seriesItem.maxScore)}`}{' '}
            · فقط داخل سری «{seriesItem.name}»
          </span>
        </div>
      </Card>

      {/* ۱) دانش‌آموز با دانش‌آموز */}
      <Card
        title="دانش‌آموز با دانش‌آموز"
        subtitle={`دو نفر را انتخاب کن — ${seriesItem.name}${
          crossTrackStudents ? ' · دو رشته‌ی مختلف: فقط دروس مشترک' : ''
        }`}
        flush
      >
        <div className="row" style={{ gap: 10, padding: '0 18px 14px', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 190, height: 34 }}
            value={studentA}
            onChange={(e) => setStudentA(e.target.value)}
            aria-label="دانش‌آموز اول"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {studentOption(s.id)}
              </option>
            ))}
          </select>
          <span className="tiny muted">در برابر</span>
          <select
            className="select"
            style={{ width: 190, height: 34 }}
            value={studentB}
            onChange={(e) => setStudentB(e.target.value)}
            aria-label="دانش‌آموز دوم"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {studentOption(s.id)}
              </option>
            ))}
          </select>
          <div style={{ flex: 1 }} />
          <Badge tone={(aValue ?? 0) >= (bValue ?? 0) ? 'blue' : 'amber'}>
            {aValue === null || bValue === null
              ? 'یکی از دو نفر این سری را ندارد'
              : `${(aValue ?? 0) >= (bValue ?? 0) ? a.name : b.name} بالاتر است`}
          </Badge>
        </div>

        <div className="grid cols-2" style={{ padding: '0 18px 18px' }}>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studentChart} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[0, scale]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ValueTip format={(v: number) => short(v)} />} cursor={{ fill: '#f7f9ff' }} />
                <Bar dataKey="value" name={isPercent ? 'درصد' : 'نمره'} radius={[7, 7, 0, 0]} barSize={38}>
                  {studentChart.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stack" style={{ gap: 12, justifyContent: 'center' }}>
            {[
              { label: `${a.name} (${aClass.name})`, value: aValue ?? 0, color: seriesItem.color },
              { label: `${b.name}`, value: bValue ?? 0, color: '#f59f00' },
              { label: `میانگین ${aClass.name}`, value: aClassValue, color: '#94a3b8' },
            ].map((row) => (
              <div key={row.label} className="stack" style={{ gap: 5 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{row.label}</span>
                  <span className="bold num small">{fmt(row.value)}</span>
                </div>
                <Progress value={(row.value / scale) * 100} color={row.color} />
              </div>
            ))}
            <div className="tiny muted">
              اختلاف {a.name.split(' ')[0]} با {b.name.split(' ')[0]}:{' '}
              <span className="bold">
                {fmt(Math.abs((aValue ?? 0) - (bValue ?? 0)))}
              </span>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>درس</th>
                <th>ضریب</th>
                <th>{a.name}</th>
                <th>{b.name}</th>
                <th>اختلاف</th>
                <th style={{ width: 160 }}>نمودار</th>
              </tr>
            </thead>
            <tbody>
              {subjectCompare.map((row) => {
                const diff = row.a - row.b;
                return (
                  <tr key={row.name}>
                    <td className="small bold">{row.name}</td>
                    <td className="tiny num muted">{fa(row.weight)}</td>
                    <td className="bold num small">{short(row.a)}</td>
                    <td className="num small">{short(row.b)}</td>
                    <td>
                      <span className="num small" style={{ color: diff >= 0 ? '#0ca678' : '#f03e3e' }}>
                        {diff >= 0 ? '+' : '−'}
                        {short(Math.abs(diff))}
                      </span>
                    </td>
                    <td>
                      <div className="stack" style={{ gap: 4 }}>
                        <Progress value={(row.a / scale) * 100} color={seriesItem.color} />
                        <Progress value={(row.b / scale) * 100} color="#f59f00" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ۲) کلاس به کلاس */}
      <Card
        title="کلاس به کلاس"
        subtitle={`دو کلاس را انتخاب کن — ${seriesItem.name}${
          crossTrackClasses ? ' · دو رشته‌ی مختلف: فقط دروس مشترک' : ''
        }`}
        flush
      >
        <div className="row" style={{ gap: 10, padding: '0 18px 14px', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 130, height: 34 }}
            value={classA}
            onChange={(e) => setClassA(e.target.value)}
            aria-label="کلاس اول"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                کلاس {c.name} · {trackLabels[c.track]}
              </option>
            ))}
          </select>
          <span className="tiny muted">در برابر</span>
          <select
            className="select"
            style={{ width: 130, height: 34 }}
            value={classB}
            onChange={(e) => setClassB(e.target.value)}
            aria-label="کلاس دوم"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                کلاس {c.name} · {trackLabels[c.track]}
              </option>
            ))}
          </select>
          <div style={{ flex: 1 }} />
          <Badge tone={classValueA >= classValueB ? 'blue' : 'amber'}>
            {classValueA >= classValueB ? classItemA.name : classItemB.name} بالاتر است
          </Badge>
        </div>

        <div className="grid cols-2" style={{ padding: '0 18px 18px' }}>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classChart} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
                <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
                <YAxis domain={[0, scale]} tick={chartTicks} {...axisStyle} />
                <Tooltip content={<ValueTip format={(v: number) => short(v)} />} cursor={{ fill: '#f7f9ff' }} />
                <Bar dataKey="value" name={isPercent ? 'درصد' : 'نمره'} radius={[7, 7, 0, 0]} barSize={40}>
                  {classChart.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="stack" style={{ gap: 12, justifyContent: 'center' }}>
            {[
              { label: `میانگین کلاس ${classItemA.name}`, value: classValueA, color: seriesItem.color },
              { label: `میانگین کلاس ${classItemB.name}`, value: classValueB, color: '#f59f00' },
              { label: 'میانگین مدرسه', value: schoolValue, color: '#cbd5e1' },
            ].map((row) => (
              <div key={row.label} className="stack" style={{ gap: 5 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="small">{row.label}</span>
                  <span className="bold num small">{fmt(row.value)}</span>
                </div>
                <Progress value={(row.value / scale) * 100} color={row.color} />
              </div>
            ))}
            <div className="tiny muted">
              اختلاف دو کلاس: <span className="bold">{fmt(Math.abs(classValueA - classValueB))}</span>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>درس</th>
                <th>ضریب</th>
                <th>کلاس {classItemA.name}</th>
                <th>کلاس {classItemB.name}</th>
                <th>اختلاف</th>
              </tr>
            </thead>
            <tbody>
              {classSubjectCompare.map((row) => {
                const diff = row.a - row.b;
                return (
                  <tr key={row.name}>
                    <td className="small bold">{row.name}</td>
                    <td className="tiny num muted">{fa(row.weight)}</td>
                    <td className="bold num small">{short(row.a)}</td>
                    <td className="num small">{short(row.b)}</td>
                    <td>
                      <span className="num small" style={{ color: diff >= 0 ? '#0ca678' : '#f03e3e' }}>
                        {diff >= 0 ? '+' : '−'}
                        {short(Math.abs(diff))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ۳) میانگین کلاس‌ها */}
      <Card
        title="میانگین کلاس‌ها"
        subtitle={`همه‌ی کلاس‌ها در ${seriesItem.name} — از بالا به پایین`}
        flush
        action={
          <div className="row" style={{ gap: 8 }}>
            <Badge tone="green">بهترین: {bestClass?.name}</Badge>
            <Badge tone="red">ضعیف‌ترین: {worstClass?.name}</Badge>
          </div>
        }
      >
        <div className="chart-wrap" style={{ padding: '0 18px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classAverages} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f7" vertical={false} />
              <XAxis dataKey="name" tick={chartTicks} {...axisStyle} />
              <YAxis domain={[0, scale]} tick={chartTicks} {...axisStyle} />
              <Tooltip content={<ValueTip format={(v: number) => short(v)} />} cursor={{ fill: '#f7f9ff' }} />
              <ReferenceLine
                y={Number(schoolValue.toFixed(2))}
                stroke="#adb5bd"
                strokeDasharray="4 4"
                label={{
                  value: 'میانگین مدرسه',
                  fontSize: 10,
                  fill: '#8b95a9',
                  position: 'insideTopLeft',
                }}
              />
              <Bar dataKey="value" name={isPercent ? 'درصد' : 'نمره'} radius={[7, 7, 0, 0]} barSize={26}>
                {classAverages.map((row) => (
                  <Cell
                    key={row.id}
                    fill={
                      row.id === classA || row.id === classB
                        ? seriesItem.color
                        : row.value >= schoolValue
                          ? '#91a7ff'
                          : '#ffc9c9'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>رتبه</th>
                <th>کلاس</th>
                <th>دانش‌آموز</th>
                <th>میانگین {seriesItem.short}</th>
                <th>اختلاف با مدرسه</th>
                <th style={{ width: 180 }}>نمودار</th>
              </tr>
            </thead>
            <tbody>
              {classAverages.map((row, index) => {
                const diff = row.value - schoolValue;
                return (
                  <tr key={row.id}>
                    <td className="num small muted">{fa(index + 1)}</td>
                    <td className="bold small">{row.name}</td>
                    <td className="tiny num muted">{fa(row.count)}</td>
                    <td className="bold num small">{fmt(row.value)}</td>
                    <td>
                      <span className="num small" style={{ color: diff >= 0 ? '#0ca678' : '#f03e3e' }}>
                        {diff >= 0 ? '+' : '−'}
                        {short(Math.abs(diff))}
                      </span>
                    </td>
                    <td>
                      <Progress value={(row.value / scale) * 100} color={seriesItem.color} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="alert info">
        <span className="tiny muted">
          هر مقایسه فقط داخل یک سری انجام می‌شود. سری‌های تشریحی (نمره‌ای) و تستی (درصدی) هیچ‌وقت با هم
          جمع نمی‌شوند.
        </span>
      </div>
    </div>
  );
}
