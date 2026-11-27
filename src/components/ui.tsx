import { useEffect, useRef, type ReactNode } from 'react';
import { fa, faPct } from '../lib/fa';

/* ---------------------------- icons ---------------------------- */

const paths: Record<string, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M17.5 20c0-2.3-1-3.9-2.6-4.8" />
    </>
  ),
  exams: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  compare: (
    <>
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M15 18l-6-6 6-6" />,
  print: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M6 17h12v4H6z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 21a2 2 0 0 0 3 0" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  alert: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  filter: <path d="M4 5h16l-6 8v6l-4 2v-8z" />,
};

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? null}
    </svg>
  );
}

/* --------------------------- primitives ------------------------- */

export function Card({
  title,
  subtitle,
  action,
  children,
  flush,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`card${flush ? ' flush' : ''}${className ? ` ${className}` : ''}`}>
      {(title || action) && (
        <div className={`card-head${flush ? ' card-head-pad' : ''}`} style={flush ? { padding: '14px 18px 12px', marginBottom: 0 } : undefined}>
          <div>
            {title && <div className="card-title">{title}</div>}
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          <div className="spacer" />
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({
  tone = 'gray',
  children,
  line,
}: {
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'gray';
  children: ReactNode;
  line?: boolean;
}) {
  return <span className={`badge ${line ? 'line' : tone}`}>{children}</span>;
}

export function Progress({ value, color }: { value: number; color?: string }) {
  const width = Math.max(0, Math.min(100, value));
  const tone = color ?? (value >= 85 ? '#0ca678' : value >= 70 ? '#4c6ef5' : value >= 50 ? '#e8940a' : '#f03e3e');
  return (
    <div className="progress">
      <span style={{ width: `${width}%`, background: tone }} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  foot,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  icon?: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      {icon && (
        <div className="icon" style={tone ? { background: `${tone}18`, color: tone } : undefined}>
          <Icon name={icon} />
        </div>
      )}
      <div className="label">{label}</div>
      <div className="value num">{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h2>{title}</h2>
          <div style={{ flex: 1 }} />
          <button ref={closeRef} className="btn ghost sm" onClick={onClose} aria-label="بستن">
            <Icon name="close" />
          </button>
        </div>
        <div className="stack">{children}</div>
        {footer && (
          <div className="row" style={{ marginTop: 18, justifyContent: 'flex-start' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageIntro({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="stack" style={{ gap: 2 }}>
      <h1>{title}</h1>
      {sub && <p className="small muted">{sub}</p>}
    </div>
  );
}

/* ------------------------- chart pieces -------------------------- */

export function ChartTip({ active, payload, label, suffix = '٪' }: any) {
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
          <span style={{ fontWeight: 700 }}>{faPct(Number(entry.value), 1)}</span>
        </div>
      ))}
    </div>
  );
}

export const chartTicks = { fontSize: 11, fill: '#8b95a9', fontFamily: 'inherit' } as const;

export const axisStyle = { axisLine: false, tickLine: false } as const;
