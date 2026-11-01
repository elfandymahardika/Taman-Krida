import { hashPassword } from '../../lib/password';
import { USERS } from './data';
import { en, Seeder } from './helpers';

/** Akun staf demo per peran. Password di-hash bcrypt sebelum disimpan (lihat daftar akun di README). */
export default {
  async up(prisma) {
    const createdAt = new Date('2026-01-05T02:00:00.000Z');
    const data = [];
    for (const u of USERS) {
      data.push({
        username: u.username,
        password_hash: await hashPassword(u.password),
        name: u.name,
        email: u.email,
        role_key: u.roleKey ? en(u.roleKey) : null,
        initials: u.initials,
        status: en(u.status),
        last_seen_at: u.lastSeenAt ? new Date(u.lastSeenAt) : null,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }
    await prisma.user.createMany({ data });
  },

  async down(prisma) {
    // Sesi, catatan, dan dokumen ikut terhapus (ON DELETE CASCADE).
    await prisma.user.deleteMany();
  },
} satisfies Seeder;
