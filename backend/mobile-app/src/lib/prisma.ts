import { PrismaClient } from '@prisma/client';
import { databaseUrl } from './databaseUrl';

/**
 * Koneksi Prisma yang dipakai controller/middleware auth (visitors & visitor_sessions).
 * Skemanya salinan prisma/schema.prisma milik backend dashboard (npm run prisma:sync).
 * Fitur lain masih memakai pool mysql2 (config/db.ts) dengan SQL murni.
 */
const prisma = new PrismaClient({ datasourceUrl: databaseUrl() });

export default prisma;

/** Nilai enum Prisma ("Perlu_ditinjau") → nilai di database ("Perlu ditinjau"). */
export const toDbEnum = (value: string) => value.replace(/_/g, ' ');
