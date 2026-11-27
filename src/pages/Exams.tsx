import { useState } from 'react';
import {
  classes,
  exams,
  orderedSeries,
  seriesById,
  seriesGroups,
  students,
  type ExamSeries,
  type SeriesId,
} from '../data/mock';
import { fa, faDate, faPct, faScore } from '../lib/fa';
import {
  examPercentForClass,
  examRawForClass,
  seriesPercentForClass,
  seriesScoreForClass,
  seriesValueForSchool,
} from '../lib/stats';
import { useClassFilter } from '../lib/classFilter';
import { Badge, Card, Icon } from '../components/ui';

function SeriesRow({
  item,
  selected,
  classFilter,
  onSelect,
}: {
  item: ExamSeries;
  selected: boolean;
  classFilter: string;
  onSelect: () => void;
}) {
  const rows = exams.filter(
    (e) => e.seriesId === item.id && (classFilter === 'all' || e.classId === classFilter),
  );
  const isPercent = item.kind === 'percent';
  const avg =
    classFilter === 'all'
      ? seriesValueForSchool(item.id)
      : isPercent
        ? seriesPercentForClass(classFilter, item.id)
        : seriesScoreForClass(classFilter, item.id);
  const rounds = [...new Set(rows.map((e) => e.round))].length;
  const roundTitles = [...new Set(rows.map((e) => e.title))];

  return (
    <tr style={{ background: selected ? '#f5f8ff' : undefined }}>
      <td>
        <div className="row" style={{ gap: 8 }}>
          <span className="dot" style={{ background: item.color }} />
          <span className="bold small">{item.name}</span>
          {item.optional && <Badge line>اختیاری</Badge>}
        </div>
      </td>
      <td className="tiny num muted">از {fa(item.maxScore)}</td>
      <td className="small">
        {fa(rows.length)} آزمون
        <span className="tiny muted"> · {fa(rounds)} دور</span>
      </td>
      <td className="tiny muted">{roundTitles.join(' · ')}</td>
      <td>
        <Badge tone={isPercent ? 'blue' : 'green'}>
          {isPercent ? faPct(avg) : `${faScore(avg)} از ${fa(item.maxScore)}`}
        </Badge>
      </td>
      <td>
        <Badge tone={item.hasTemplate ? 'green' : 'amber'} line>
          {item.hasTemplate ? 'قالب آماده' : 'قالب ندارد'}
        </Badge>
      </td>
      <td>
        <button className={`btn sm${selected ? ' primary' : ''}`} onClick={onSelect}>
          دیدن آزمون‌ها
        </button>
      </td>
    </tr>
  );
}

export default function Exams() {
  const [seriesId, setSeriesId] = useState<SeriesId>('ghalamchi');
  const classFilter = useClassFilter();
  const seriesItem = seriesById(seriesId);
  const isPercent = seriesItem.kind === 'percent';
  const className = classes.find((c) => c.id === classFilter)?.name;
  const rows = exams
    .filter((e) => e.seriesId === seriesId && (classFilter === 'all' || e.classId === classFilter))
    .sort((left, right) => left.round - right.round || left.classId.localeCompare(right.classId));

  return (
    <div className="stack">
      <div className="alert info">
        <Icon name="alert" size={16} />
        <div>
          آزمون‌ها به دو خانواده‌ی جدا تقسیم شده‌اند: <b>تشریحی</b> (نمره‌ای از ۲۰) و <b>تستی</b> (درصدی
          از ۱۰۰). میانگین‌ها، رتبه‌ها و نمودارهای هر سری جدا حساب می‌شوند و هیچ‌وقت با هم جمع نمی‌شوند.
        </div>
      </div>

      {seriesGroups.map((group) => {
        const items = group.ids.map((id) => seriesById(id));
        return (
          <Card key={group.title} title={group.title} subtitle={group.note} flush>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>سری</th>
                    <th>حداکثر</th>
                    <th>تعداد</th>
                    <th>دورها</th>
                    <th>{classFilter === 'all' ? 'میانگین مدرسه' : `میانگین ${className ?? 'کلاس'}`}</th>
                    <th>قالب</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <SeriesRow
                      key={item.id}
                      item={item}
                      selected={seriesId === item.id}
                      classFilter={classFilter}
                      onSelect={() => setSeriesId(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      <Card
        title={`آزمون‌های ${seriesItem.name}${classFilter === 'all' ? '' : ` — کلاس ${className ?? ''}`}`}
        subtitle={`${fa(rows.length)} آزمون · ${
          isPercent ? 'درصدی از ۱۰۰' : `نمره‌ای از ${fa(seriesItem.maxScore)}`
        } · ${seriesItem.templateNote}`}
        action={
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {orderedSeries.map((s) => (
              <button
                key={s.id}
                className={`chip${seriesId === s.id ? ' active' : ''}`}
                onClick={() => setSeriesId(s.id)}
              >
                {s.short}
              </button>
            ))}
          </div>
        }
        flush
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>آزمون</th>
                <th>کلاس</th>
                <th>دور</th>
                <th>تاریخ</th>
                <th>دانش‌آموز</th>
                <th>میانگین کلاس</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((exam) => {
                const count = students.filter((st) => st.classId === exam.classId).length;
                const percent = examPercentForClass(exam.id);
                const raw = examRawForClass(exam.id);
                const tone =
                  percent >= 85 ? 'green' : percent >= 70 ? 'blue' : percent >= 50 ? 'amber' : 'red';
                return (
                  <tr key={exam.id}>
                    <td className="bold small">{exam.title}</td>
                    <td className="small">{classes.find((c) => c.id === exam.classId)?.name}</td>
                    <td className="tiny num muted">{fa(exam.round)}</td>
                    <td className="tiny num muted">{faDate(exam.date)}</td>
                    <td className="tiny num">{fa(count)}</td>
                    <td>
                      <Badge tone={tone}>
                        {isPercent ? faPct(percent) : `${faScore(raw)} از ${fa(exam.maxScore)}`}
                      </Badge>
                    </td>
                    <td>
                      <a className="btn sm" href={`#/exams/${exam.id}`}>
                        ورود نمره
                      </a>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      {classFilter === 'all'
                        ? 'برای این سری آزمونی ثبت نشده است.'
                        : `برای کلاس ${className ?? ''} در این سری آزمونی ثبت نشده است.`}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
