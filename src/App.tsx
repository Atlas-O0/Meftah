import { useEffect, useState } from 'react';
import Layout, { Login } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import Exams from './pages/Exams';
import ExamEntry from './pages/ExamEntry';
import Upload from './pages/Upload';
import Compare from './pages/Compare';
import Records from './pages/Records';
import Settings from './pages/Settings';

function useRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(read);
  useEffect(() => {
    const onChange = () => setPath(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const path = useRoute();

  if (!authed) return <Login onEnter={() => setAuthed(true)} />;

  const parts = path.split('/').filter(Boolean);

  let page = <Dashboard />;
  let title = 'داشبورد';
  let subtitle = 'نمای کلی مدرسه در این ماه';

  if (parts[0] === 'students') {
    if (parts[1]) {
      page = <StudentProfile id={parts[1]} />;
      title = 'پروفایل دانش‌آموز';
      subtitle = 'کارنامه‌ها، رشد، سطح و انضباط';
    } else {
      page = <Students />;
      title = 'دانش‌آموزان';
      subtitle = 'جستجو، فیلتر و پروفایل';
    }
  } else if (parts[0] === 'exams') {
    if (parts[1]) {
      page = <ExamEntry id={parts[1]} />;
      title = 'ورود نمره‌ی آزمون';
      subtitle = 'جدول نمره‌ها — نسخه‌ی نمایشی';
    } else {
      page = <Exams />;
      title = 'آزمون‌ها';
      subtitle = 'تشریحی (نمره‌ای) و تستی (درصدی) — به تفکیک سری و کلاس';
    }
  } else if (parts[0] === 'upload') {
    page = <Upload />;
    title = 'آپلود کارنامه';
    subtitle = 'PDF یا عکس → بازبینی → ثبت';
  } else if (parts[0] === 'compare') {
    page = <Compare />;
    title = 'مقایسه';
    subtitle = 'دانش‌آموز با دانش‌آموز، کلاس با کلاس و میانگین کلاس‌ها';
  } else if (parts[0] === 'records') {
    page = <Records />;
    title = 'گزارش‌ها';
    subtitle = 'انضباطی، فرهنگی، پژوهشی و ورزشی';
  } else if (parts[0] === 'settings') {
    page = <Settings />;
    title = 'تنظیمات';
    subtitle = 'کلاس‌ها، دروس، سری‌ها و سطح‌بندی';
  }

  return (
    <Layout path={path} title={title} subtitle={subtitle}>
      {page}
    </Layout>
  );
}
