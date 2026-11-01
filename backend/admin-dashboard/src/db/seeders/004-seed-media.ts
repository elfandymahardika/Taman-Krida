import { storageService } from '../../services/storage.service';
import { MEDIA } from './data';
import { day, en, Seeder } from './helpers';

/** Koleksi awal virtual galeri (memakai foto bawaan aplikasi). */
export default {
  async up(prisma) {
    await prisma.media.createMany({
      data: MEDIA.map((m) => ({
        id: m.id,
        title: m.title,
        collection: m.collection,
        date: day(m.date),
        type: en(m.type),
        photo: m.photo,
        status: en(m.status),
        credit: m.credit,
        description: m.description ?? null,
        bytes: BigInt(Math.round(m.bytes)),
        dims: m.dims,
        created_at: new Date(`${m.date}T03:00:00.000Z`),
      })),
    });
  },

  async down(prisma) {
    // Berkas unggahan (folder uploads/ atau Vercel Blob) dihapus dulu agar tidak tertinggal tanpa metadata.
    const uploaded = await prisma.media.findMany({ where: { file: { not: null } }, select: { file: true } });
    for (const m of uploaded) await storageService.deleteFile(m.file!);
    await prisma.media.deleteMany();
  },
} satisfies Seeder;
