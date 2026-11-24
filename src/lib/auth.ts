/**
 * ورود تک‌کاربره.
 * روی سرور: رمز در API بررسی می‌شود و یک نشست HttpOnly برمی‌گردد.
 * بدون سرور (نسخه‌ی استاتیک): همان نام کاربری/رمز در همین‌جا بررسی می‌شود.
 */

import { apiUrl, isServerOnline } from './api';

const KEY = 'meftah-auth-v1';
const FALLBACK_USER = 'Meftah';
const FALLBACK_PASS = 'MeftahMeftah';

export interface LoginResult {
  ok: boolean;
  error?: string;
  offline?: boolean;
}

export function isLoggedIn(): boolean {
  try {
    return (localStorage.getItem(KEY) ?? '').startsWith('ok');
  } catch {
    return false;
  }
}

export function markLoggedIn(offline = false) {
  try {
    localStorage.setItem(KEY, offline ? 'ok-offline' : 'ok');
  } catch {
    /* بی‌اهمیت */
  }
}

export function markLoggedOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* بی‌اهمیت */
  }
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const user = username.trim();

  if (isServerOnline()) {
    try {
      const response = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: user, password }),
      });
      if (response.ok) {
        markLoggedIn();
        return { ok: true };
      }
      if (response.status === 401) return { ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
      return { ok: false, error: 'سرور پاسخ درست نداد؛ دوباره تلاش کن.' };
    } catch {
      /* اگر سرور قطع شد، حالت مرورگر بررسی می‌شود */
    }
  }

  if (user === FALLBACK_USER && password === FALLBACK_PASS) {
    markLoggedIn(true);
    return { ok: true, offline: true };
  }
  return { ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.' };
}

export async function logout() {
  markLoggedOut();
  if (!isServerOnline()) return;
  try {
    await fetch(apiUrl('/api/logout'), { method: 'POST' });
  } catch {
    /* بی‌اهمیت */
  }
}
