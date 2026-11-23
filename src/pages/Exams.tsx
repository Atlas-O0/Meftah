import { classes, exams, series, students } from '../data/mock';
import { fa, faDate, faPct } from '../lib/fa';
import { examPercentForClass } from '../lib/stats';
import { Badge, Card, Icon } from '../components/ui';

export default function Exams() {
  return (
    <div className="stack">
      <div className="alert info">
        <Icon name="alert" size={16} />
        <div>
          هر آزمون فقط به یک سری تعلق دارد. میانگین‌ها و نمودارهای هر سری جدا حساب می‌شوند؛ این
          کارنامه‌ها هیچ‌وقت با هم جمع نمی‌شوند.
        </div>
      </div>

      {series.map((s) => {
        const rows = exams.filter((e) => e.seriesId === s.id);
        const avg = rows.length
          ? rows.reduce((sum, exam) => sum + examPercentForClass(exam.id), 0) / rows.length
          : 0;
        return (
          <Card
            key={s.id}
            title={
              <span className="row" style={{ gap: 8 }}>
                <span className="dot" style={{ background: s.color }} />
                {s.name}
              </span>
            }
            subtitle={`${fa(rows.length)} آزمون · حداکثر نمره ${fa(s.maxScore)} · ${
              s.hasTemplate ? 'قالب آماده' : 'قالب ندارد'
            }`}
            action={
              <div className="row" style={{ gap: 8 }}>
                <span className="tiny muted">میانگین سری</span>
                <span className="bold num small">{faPct(avg)}</span>
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
                    <th>نوع</th>
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
                    return (
                      <tr key={exam.id}>
                        <td className="bold small">{exam.title}</td>
                        <td className="small">{classes.find((c) => c.id === exam.classId)?.name}</td>
                        <td>
                          <Badge line>{exam.kind}</Badge>
                        </td>
                        <td className="tiny num muted">{faDate(exam.date)}</td>
                        <td className="tiny num">{fa(count)}</td>
                        <td>
                          <Badge tone={percent >= 85 ? 'green' : percent >= 70 ? 'blue' : percent >= 50 ? 'amber' : 'red'}>
                            {faPct(percent)}
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
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
