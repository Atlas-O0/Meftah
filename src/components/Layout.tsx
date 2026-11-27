import { useState, type ReactNode } from 'react';
import { currentUser, classes, students } from '../data/mock';
import { fa, faPct } from '../lib/fa';
import { Icon } from './ui';
import { dataSource } from '../lib/bootstrap';
import { login, logout } from '../lib/auth';
import { setClassFilter, useClassFilter } from '../lib/classFilter';
import { useDirectoryVersion } from '../lib/directory';
import { needsAttention } from '../lib/stats';

export const navigate = (path: string) => {
  window.location.hash = path;
};

const nav = [
  { path: '/', label: 'داشبورد', icon: 'dashboard' },
  { path: '/students', label: 'دانش‌آموزان', icon: 'users' },
  { path: '/exams', label: 'آزمون‌ها', icon: 'exams' },
  { path: '/upload', label: 'آپلود کارنامه', icon: 'upload' },
  { path: '/records', label: 'گزارش‌ها', icon: 'file' },
  { path: '/compare', label: 'مقایسه', icon: 'compare' },
  { path: '/settings', label: 'تنظیمات', icon: 'settings' },
];

export default function Layout({
  path,
  title,
  subtitle,
  actions,
  children,
}: {
  path: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const classFilter = useClassFilter();
  useDirectoryVersion();
  const attention = needsAttention(5);
  const filterable = path === '/students' || path === '/exams' || path === '/records';

  const isActive = (target: string) =>
    target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`);

  return (
    <div className="app">
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">م</div>
          <div>
            <div className="brand-name">مفتاح</div>
            <div className="brand-sub">پروفایل و کارنامه دانش‌آموزان</div>
          </div>
        </div>

        <div className="nav-label">منو</div>
        {nav.map((item) => (
          <a
            key={item.path}
            href={`#${item.path}`}
            className={`nav-item${isActive(item.path) ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}

        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">م</div>
            <div style={{ minWidth: 0 }}>
              <div className="name">{currentUser.name}</div>
              <div className="role">{currentUser.role}</div>
            </div>
          </div>
          <div className="tiny muted" style={{ padding: '6px 8px 0', lineHeight: 1.6 }}>
            {dataSource.online ? 'دیتابیس متصل — data/meftah.db' : 'حالت مرورگر — بدون سرور'}
          </div>
        </div>
      </aside>

      <div className={`scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="burger" onClick={() => setOpen(true)} aria-label="منو">
            <Icon name="menu" />
          </button>

          <div className="topbar-title">
            <h1>{title}</h1>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>

          <div className="spacer" />

          {filterable && (
            <select
              className="select"
              style={{ width: 150, height: 34 }}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              aria-label="انتخاب کلاس"
            >
              <option value="all">همه‌ی کلاس‌ها</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  کلاس {c.name}
                </option>
              ))}
            </select>
          )}

          <div className="row" style={{ gap: 6 }}>
            {actions}
            <div style={{ position: 'relative' }}>
              {bellOpen && <div className="popover-scrim" onClick={() => setBellOpen(false)} />}
              <button
                className="btn sm"
                onClick={() => setBellOpen((value) => !value)}
                title="دانش‌آموزان نیازمند توجه"
                aria-label="هشدارها"
                aria-expanded={bellOpen}
              >
                <Icon name="bell" size={16} />
                {attention.length > 0 && <span className="bell-dot">{fa(attention.length)}</span>}
              </button>
              {bellOpen && (
                <div className="popover">
                  <div className="tiny muted" style={{ padding: '2px 6px 8px' }}>
                    نیازمند توجه در قلمچی — از {fa(students.length)} دانش‌آموز
                  </div>
                  {attention.length === 0 && (
                    <div className="small muted" style={{ padding: '4px 6px' }}>
                      کسی زیر مرز نیست.
                    </div>
                  )}
                  {attention.map((row) => (
                    <a
                      key={row.student.id}
                      href={`#/students/${row.student.id}`}
                      className="popover-item"
                      onClick={() => setBellOpen(false)}
                    >
                      <span className="small" style={{ fontWeight: 600 }}>{row.student.name}</span>
                      <span className="tiny num muted">{faPct(row.percent ?? 0, 0)}</span>
                    </a>
                  ))}
                  {attention.length > 0 && (
                    <a href="#/students" className="popover-all" onClick={() => setBellOpen(false)}>
                      دیدن فهرست دانش‌آموزان
                    </a>
                  )}
                </div>
              )}
            </div>
            <button
              className="avatar"
              title="خروج از حساب"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              م
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}

/* ----------------------------- login ----------------------------- */

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [user, setUser] = useState('Meftah');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const result = await login(user, pass);
    setBusy(false);
    if (result.ok) onSuccess();
    else setError(result.error ?? 'ورود ناموفق بود.');
  };

  return (
    <div className="login-wrap">
      <div className="login-art">
        <div className="row" style={{ gap: 10 }}>
          <div className="brand-mark" style={{ background: 'rgba(255,255,255,.16)' }}>
            م
          </div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>مفتاح</div>
        </div>

        <div>
          <h2>همه‌ی نمره‌ها، رشد و انضباط هر دانش‌آموز در یک پروفایل</h2>
          <p>
            کارنامه‌های PDF و عکس را وارد کن، نمره‌ها خودکار در پروفایل دانش‌آموز بنشیند و نمودار رشد،
            مقایسه با میانگین کلاس و سطح هر دانش‌آموز را ببین.
          </p>
          {[
            'کارنامه‌ی همه‌ی آزمون‌ها، جدا برای هر سری',
            'نمودار رشد و مقایسه با میانگین کلاس',
            'گزارش انضباطی در همان پروفایل',
          ].map((t) => (
            <div className="feat" key={t}>
              <Icon name="check" size={15} />
              {t}
            </div>
          ))}
        </div>

        <div className="tiny" style={{ color: 'rgba(255,255,255,.6)' }}>
          اجرا در شبکه‌ی مدرسه یا VPS · داده‌ها در یک فایل SQLite
        </div>
      </div>

      <div className="login-form">
        <div className="login-box">
          <h1>ورود به سامانه</h1>
          <p className="small muted">یک حساب مدیریت مدرسه — بدون نام کاربری و رمز وارد نمی‌شوی.</p>

          <div className="field">
            <label>نام کاربری</label>
            <input
              className="input"
              value={user}
              autoComplete="username"
              onChange={(e) => setUser(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>
          <div className="field">
            <label>رمز عبور</label>
            <input
              className="input"
              type="password"
              value={pass}
              autoComplete="current-password"
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
            />
          </div>

          {error && (
            <div className="tiny" style={{ color: '#e03131', marginBottom: 8 }}>
              {error}
            </div>
          )}

          <button className="btn primary block" onClick={() => void submit()} disabled={busy}>
            {busy ? 'در حال ورود…' : 'ورود'}
          </button>

          <div className="demo-hint">
            رمز را می‌شود روی سرور با متغیرهای <span style={{ direction: 'ltr', display: 'inline-block' }}>
              MEFTAH_USER
            </span>{' '}
            و <span style={{ direction: 'ltr', display: 'inline-block' }}>MEFTAH_PASS</span> عوض کرد؛ در حالت
            استاتیک (بدون سرور) همان رمز پیش‌فرض بررسی می‌شود.
          </div>
        </div>
      </div>
    </div>
  );
}
