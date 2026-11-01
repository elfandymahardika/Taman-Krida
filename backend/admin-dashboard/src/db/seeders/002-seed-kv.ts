import { DEFAULT_SETTINGS } from '../../lib/settings';
import { PROFILE } from './data';
import { Seeder } from './helpers';

/** Profil lembaga & pengaturan panel bawaan. */
export default {
  async up(prisma) {
    const updated_at = new Date('2026-09-28T03:00:00.000Z');
    await prisma.kv.createMany({
      data: [
        { name: 'profile', value: JSON.stringify(PROFILE), updated_at, updated_by: 'Admin Pusat' },
        { name: 'settings', value: JSON.stringify(DEFAULT_SETTINGS), updated_at, updated_by: 'Admin Pusat' },
      ],
    });
  },

  async down(prisma) {
    await prisma.kv.deleteMany();
  },
} satisfies Seeder;
