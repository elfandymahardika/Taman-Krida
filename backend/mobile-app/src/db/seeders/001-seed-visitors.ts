import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../lib/password';
import { VISITORS } from './data';

/** Akun pengunjung demo. Password di-hash bcrypt sebelum disimpan (lihat daftar akun di README). */
export default {
  async up(prisma: PrismaClient) {
    const data = [];
    for (const v of VISITORS) {
      data.push({
        name: v.name,
        email: v.email,
        phone: v.phone,
        city: v.city,
        password_hash: await hashPassword(v.password),
        created_at: new Date(v.createdAt),
        updated_at: new Date(v.createdAt),
      });
    }
    await prisma.visitor.createMany({ data });
  },

  async down(prisma: PrismaClient) {
    // Sesi, tautan pesanan/sewa/komunitas, berkas, dan notifikasi ikut terhapus (ON DELETE CASCADE).
    await prisma.visitor.deleteMany();
  },
};
