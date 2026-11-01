import { PrismaClient } from '@prisma/client';
import { databaseUrl } from './databaseUrl';

/**
 * Koneksi Prisma yang dipakai controller/middleware (auth: users & sessions).
 * Satu instance untuk seluruh aplikasi; skema ada di prisma/schema.prisma.
 * Fitur lain masih memakai pool mysql2 (config/db.ts) dengan SQL murni.
 */
const prisma = new PrismaClient({ datasourceUrl: databaseUrl() });

export default prisma;

/** Nilai enum Prisma ("Menunggu_persetujuan") ↔ nilai di database ("Menunggu persetujuan"). */
export const fromDbEnum = <T extends string>(value: string) => value.replace(/ /g, '_') as T;
export const toDbEnum = (value: string) => value.replace(/_/g, ' ');
