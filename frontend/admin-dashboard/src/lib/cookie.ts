/**
 * Nama cookie sesi login. Isinya token JWT dari backend Express, disetel oleh Server Action login
 * sebagai cookie HttpOnly + SameSite=Lax (+ Secure di HTTPS/localhost), sehingga tidak bisa dibaca JavaScript di browser.
 * Dipakai proxy.ts (pagar kasar), DAL (lib/dal.ts), dan proxy API (/api/be).
 */
export const SESSION_COOKIE = 'tkbj_session'
