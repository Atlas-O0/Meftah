import { useState, type ReactNode } from 'react';
import { currentUser, classes } from '../data/mock';
import { fa } from '../lib/fa';
import { Icon } from './ui';
import { dataSource } from '../lib/bootstrap';

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
  const [cls, setCls] = useState('all');

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

          <select
            className="select"
            style={{ width: 150, height: 34 }}
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            aria-label="انتخاب کلاس"
          >
            <option value="all">همه‌ی کلاس‌ها</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="row" style={{ gap: 6 }}>
            {actions}
            <button className="btn sm" onClick={() => navigate('/settings')} title="تنظیمات">
              <Icon name="bell" size={16} />
            </button>
            <div className="avatar" title={currentUser.name}>
              م
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}

/* ----------------------------- login ----------------------------- */

export function Login({ onEnter }: { onEnter: () => void }) {
  const [user, setUser] = useState('mousavi');
  const [pass, setPass] = useState('demo1234');

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
          <p className="small muted">برای ورود به نسخه‌ی نمایشی نیازی به رمز واقعی نیست.</p>

          <div className="field">
            <label>نام کاربری</label>
            <input className="input" value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div className="field">
            <label>رمز عبور</label>
            <input
              className="input"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter()}
            />
          </div>

          <button className="btn primary block" onClick={onEnter}>
            ورود
          </button>
          <button className="btn block" onClick={onEnter}>
            ورود سریع بدون رمز
          </button>

          <div className="demo-hint">
            این صفحه فقط ظاهر ورود را نشان می‌دهد. در مرحله‌ی بعد، رمزها واقعی و هش‌شده خواهند بود و
            داده‌ها در SQLite همین کامپیوتر ذخیره می‌شوند ({fa(classes.length)} کلاس نمونه).
          </div>
        </div>
      </div>
    </div>
  );
}
