import { Request } from 'express';
import { queryText } from './http';

/** Permintaan satu halaman data: `?page=1&limit=10` → OFFSET/LIMIT untuk SQL. */
export interface PageRequest {
  page: number;
  limit: number;
  offset: number;
}

/** Bentuk respons daftar berhalaman, sama untuk semua endpoint. */
export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const positiveInt = (v: unknown) => {
  const n = Math.floor(Number(queryText(v)));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Baca `page` & `limit` dari query string. Mengembalikan `null` bila `page` tidak dikirim, sehingga endpoint
 * lama yang mengembalikan array biasa tetap bekerja untuk pemanggil yang belum memakai paginasi.
 * `limit` dibatasi `maxLimit` agar klien tidak bisa meminta ribuan baris sekaligus.
 */
export function pageRequest(
  query: Request['query'],
  { defaultLimit = 10, maxLimit = 100 }: { defaultLimit?: number; maxLimit?: number } = {},
): PageRequest | null {
  if (query.page === undefined) return null;
  const page = positiveInt(query.page) ?? 1;
  const limit = Math.min(positiveInt(query.limit) ?? defaultLimit, maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

export const paginated = <T>(data: T[], total: number, { page, limit }: PageRequest): Paginated<T> => ({
  data,
  pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});
