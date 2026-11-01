export type FieldErrors = Record<string, string>;

/** Error dengan status HTTP. `fields` berisi pesan per kolom formulir. */
export class HttpError extends Error {
  status: number;
  fields?: FieldErrors;

  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const badRequest = (message: string, fields?: FieldErrors) => new HttpError(400, message, fields);
export const notFound = (what: string) => new HttpError(404, `${what} tidak ditemukan.`);
export const conflict = (message: string, fields?: FieldErrors) => new HttpError(409, message, fields);

/** Lempar 400 bila objek error validasi tidak kosong. */
export function assertValid(errors: FieldErrors, message = 'Periksa kembali isian formulir.') {
  if (Object.keys(errors).length) throw badRequest(message, errors);
}

/** Pola LIKE aman untuk input pengguna (backslash = karakter escape bawaan MySQL). */
export const likePattern = (q: unknown) => `%${String(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Nilai yang boleh dikirim sebagai parameter query (`?`). */
export type SqlValue = string | number | boolean | Date | null;

export type Condition = [string, ...SqlValue[]] | false | null | undefined | '' | 0;

/**
 * Susun klausa WHERE dari daftar kondisi `[sql, ...params]`; kondisi falsy dilewati.
 * Contoh: where([from && ['date >= ?', from], q && ['name LIKE ?', likePattern(q)]])
 */
export function where(conditions: Condition[]) {
  const active = conditions.filter((c): c is [string, ...SqlValue[]] => Array.isArray(c));
  return {
    sql: active.length ? `WHERE ${active.map(([sql]) => sql).join(' AND ')}` : '',
    params: active.flatMap(([, ...params]) => params),
  };
}

/** Nilai query string (?q=...) sebagai teks; kosong bila tidak dikirim. */
export const queryText = (v: unknown) => (typeof v === 'string' ? v.trim() : Array.isArray(v) ? String(v[0] ?? '').trim() : '');

/** Error "Duplicate entry" (PRIMARY/UNIQUE bentrok) dari mysql2 (ER_DUP_ENTRY) atau Prisma (P2002). */
export const isDuplicate = (error: unknown) => ['ER_DUP_ENTRY', 'P2002'].includes((error as { code?: string })?.code ?? '');

/**
 * Ulangi bila nomor urut (TK-/SG-) bentrok dengan permintaan lain yang berjalan bersamaan:
 * nomor dihitung dari MAX(id), jadi dua transaksi bisa mendapat nomor sama dan salah satunya ditolak PRIMARY KEY.
 */
export async function retryOnDuplicate<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!isDuplicate(error) || i >= attempts) throw error;
    }
  }
}
