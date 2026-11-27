import { lazy, Suspense, useEffect, useState } from 'react';
import Layout, { Login } from './components/Layout';
import { isLoggedIn } from './lib/auth';

/* صفحه‌ها جدا بارگیری می‌شوند تا بازکردن اول سایت سبک باشد */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Exams = lazy(() => import('./pages/Exams'));
const ExamEntry = lazy(() => import('./pages/ExamEntry'));
const Upload = lazy(() => import('./pages/Upload'));
const Compare = lazy(() => import('./pages/Compare'));
const Records = lazy(() => import('./pages/Records'));
const Settings = lazy(() => import('./pages/Settings'));

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
  const [authed, setAuthed] = useState(isLoggedIn);
  const path = useRoute();

  /* بعد از ورود، صفحه دوباره بارگذاری می‌شود تا داده‌ی دیتابیس خوانده شود */
  if (!authed) return <Login onSuccess={() => { setAuthed(true); window.location.reload(); }} />;

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
      subtitle = 'ثبت و ویرایش نمره‌ی دستی در همین آزمون';
    } else {
      page = <Exams />;
      title = 'آزمون‌ها';
      subtitle = 'تشریحی (نمره‌ای) و تستی (درصدی) — به تفکیک سری و کلاس';
    }
  } else if (parts[0] === 'upload') {
    page = <Upload />;
    title = 'آپلود کارنامه';
    subtitle = 'اکسل → بازبینی → ساخت پروفایل و ثبت نمره';
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
      <Suspense fallback={<div className="page-loading">در حال بارگذاری…</div>}>{page}</Suspense>
    </Layout>
  );
}
