/**
 * سرور سایت مفتاح — سایت و API از یک آدرس.
 * اجرا:  bun run build  و بعد  bun run start
 * پورت پیش‌فرض: 3000  ·  داده: data/meftah.db
 * برای دسترسی از شبکه‌ی مدرسه: HOST=0.0.0.0 PORT=3000 bun run start
 */

import { existsSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { BACKUP_DIR, DB_PATH, applyPatch, bootstrap, clearAll, createBackup, stats, type DataPatch } from './db';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const DIST = resolve(process.env.MEFTAH_DIST ?? 'dist');

const corsHeaders = (origin: string | null): Record<string, string> =>
  origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      }
    : {};

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

    if (pathname === '/api/health') {
      return json({ ok: true, database: DB_PATH, backupDir: BACKUP_DIR, counts: stats() }, 200, origin);
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
if (!existsSync(join(DIST, 'index.html'))) console.log('هشدار: dist ساخته نشده؛ فقط API در دسترس است.');
