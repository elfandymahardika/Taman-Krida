import type { PrismaClient } from '@prisma/client';
import { fromDbEnum } from '../../lib/prisma';

/** Satu seeder: `up` mengisi data contoh, `down` menghapusnya (urutan dijalankan oleh run.ts). */
export interface Seeder {
  up(prisma: PrismaClient): Promise<void>;
  down(prisma: PrismaClient): Promise<void>;
}

/** "2026-10-02" → Date untuk kolom DATE. */
export const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** "19:00" → Date untuk kolom TIME (Prisma menyimpan jam pada tanggal 1970-01-01). */
export const time = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);

/**
 * Nilai enum seperti di database ("Perlu verifikasi") → nama enum Prisma ("Perlu_verifikasi").
 * Data contoh berupa teks bebas, jadi tipenya disesuaikan dengan kolom tujuan (Prisma tetap
 * menolak nilai yang tidak ada di enum saat dijalankan).
 */
export const en = <T extends string = never>(value: string) => fromDbEnum<T>(value);
