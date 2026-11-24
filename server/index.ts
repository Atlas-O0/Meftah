/**
 * سرور سایت مفتاح — سایت و API از یک آدرس.
 * اجرا:  bun run build  و بعد  bun run start
 * پورت پیش‌فرض: 3000  ·  داده: data/meftah.db
 * برای دسترسی از شبکه‌ی مدرسه: HOST=0.0.0.0 PORT=3000 bun run start
 */

import { existsSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import {
  BACKUP_DIR,
  DB_PATH,
  applyPatch,
  bootstrap,
  clearAll,
  createBackup,
  getSettings,
  saveSettings,
  stats,
  type DataPatch,
} from './db';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const DIST = resolve(process.env.MEFTAH_DIST ?? 'dist');

/* یک حساب واحد؛ با متغیرهای محیطی قابل تغییر است */
const AUTH_USER = process.env.MEFTAH_USER ?? 'Meftah';
const AUTH_PASS = process.env.MEFTAH_PASS ?? 'MeftahMeftah';
const SESSION_COOKIE = 'meftah_session';
const SESSION_TTL = 12 * 60 * 60 * 1000;
const sessions = new Map<string, number>();

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function isAuthed(request: Request): boolean {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const expires = sessions.get(token);
  if (!expires) return false;
  if (expires < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

const corsHeaders = (origin: string | null): Record<string, string> =>
  origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      }
    : {};

const PROTECTED = ['/api/bootstrap', '/api/patch', '/api/clear', '/api/backup', '/api/settings'];

const json = (data: unknown, status = 200, origin: string | null = null) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store', ...corsHeaders(origin) } });

function serveStatic(pathname: string): Response {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const target = resolve(DIST, relative || 'index.html');
  if (!target.startsWith(DIST)) return new Response('مسیر نامعتبر', { status: 400 });

  if (existsSync(target) && statSync(target).isFile()) return new Response(Bun.file(target));

  const index = join(DIST, 'index.html');
  if (!relative.includes('.') && existsSync(index)) return new Response(Bun.file(index));

  if (!existsSync(index)) {
    return new Response('سایت ساخته نشده است. اول «bun run build» را اجرا کن، بعد «bun run start».', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response('یافت نشد', { status: 404 });
}

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  idleTimeout: 60,
  async fetch(request) {
    const origin = request.headers.get('origin');
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });

    if (pathname === '/api/settings' && request.method === 'GET') {
      if (!isAuthed(request)) return json({ ok: false, error: 'برای دسترسی باید وارد شوی' }, 401, origin);
      return json({ ok: true, settings: getSettings() }, 200, origin);
    }

    if (pathname === '/api/settings' && request.method === 'POST') {
      if (!isAuthed(request)) return json({ ok: false, error: 'برای دسترسی باید وارد شوی' }, 401, origin);
      try {
        const body = (await request.json()) as Record<string, unknown>;
        return json({ ok: true, settings: saveSettings(body) }, 200, origin);
      } catch (error) {
        return json({ ok: false, error: String(error) }, 400, origin);
      }
    }

    if (pathname === '/api/health') {
      return json({ ok: true, database: DB_PATH, backupDir: BACKUP_DIR, counts: stats() }, 200, origin);
    }

    if (pathname === '/api/session') {
      return json({ ok: true, authenticated: isAuthed(request), user: AUTH_USER }, 200, origin);
    }

    if (pathname === '/api/login' && request.method === 'POST') {
      let body: { username?: string; password?: string } = {};
      try {
        body = (await request.json()) as { username?: string; password?: string };
      } catch {
        return json({ ok: false, error: 'اطلاعات ورود ناقص است' }, 400, origin);
      }
      const username = String(body.username ?? '').trim();
      const password = String(body.password ?? '');
      if (username !== AUTH_USER || password !== AUTH_PASS) {
        return json({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است' }, 401, origin);
      }
      const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
      sessions.set(token, Date.now() + SESSION_TTL);
      return Response.json(
        { ok: true, user: AUTH_USER },
        {
          headers: {
            'set-cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL / 1000}`,
            'cache-control': 'no-store',
            ...corsHeaders(origin),
          },
        },
      );
    }

    if (pathname === '/api/logout' && request.method === 'POST') {
      const token = readCookie(request, SESSION_COOKIE);
      if (token) sessions.delete(token);
      return Response.json(
        { ok: true },
        {
          headers: {
            'set-cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
            ...corsHeaders(origin),
          },
        },
      );
    }

    if (PROTECTED.includes(pathname) && !isAuthed(request)) {
      return json({ ok: false, error: 'برای دسترسی باید وارد شوی' }, 401, origin);
    }

    if (pathname === '/api/bootstrap') return json(bootstrap(), 200, origin);

    if (pathname === '/api/patch' && request.method === 'POST') {
      try {
        const patch = (await request.json()) as DataPatch;
        const counts = applyPatch(patch);
        return json({ ok: true, counts, totals: stats() }, 200, origin);
      } catch (error) {
        return json({ ok: false, error: String(error) }, 400, origin);
      }
    }

    if (pathname === '/api/clear' && request.method === 'POST') {
      clearAll();
      return json({ ok: true, totals: stats() }, 200, origin);
    }

    if (pathname === '/api/backup') {
      const file = createBackup();
      const name = file.split(/[\\/]/).pop() ?? 'meftah-backup.db';
      return new Response(Bun.file(file), {
        headers: { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="${name}"` },
      });
    }

    if (pathname.startsWith('/api/')) return json({ ok: false, error: 'مسیر ناشناخته' }, 404, origin);

    return serveStatic(pathname);
  },
});

console.log(`مفتاح روی http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${server.port} بالا آمد`);
console.log(`دیتابیس: ${DB_PATH}`);
console.log(`پشتیبان‌ها: ${BACKUP_DIR}`);
console.log(`حساب کاربری: ${AUTH_USER} (رمز با MEFTAH_PASS قابل تغییر است)`);
if (!existsSync(join(DIST, 'index.html'))) console.log('هشدار: dist ساخته نشده؛ فقط API در دسترس است.');
