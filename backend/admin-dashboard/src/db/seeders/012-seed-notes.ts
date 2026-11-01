import type { NoteStatus } from '@prisma/client';
import { NOTES } from './data';
import { en, Seeder } from './helpers';

/** Catatan staf contoh milik beberapa akun, untuk menguji isolasi data antar-user (anti-IDOR). */
export default {
  async up(prisma) {
    const users = await prisma.user.findMany({ select: { id: true, username: true } });
    const idOf = new Map(users.map((u) => [u.username, u.id]));
    await prisma.note.createMany({
      data: NOTES.map((n) => ({
        user_id: idOf.get(n.username)!,
        title: n.title,
        content: n.content,
        status: en<NoteStatus>(n.status),
        created_at: new Date(n.createdAt),
        updated_at: new Date(n.createdAt),
      })),
    });
  },

  async down(prisma) {
    await prisma.note.deleteMany();
  },
} satisfies Seeder;
