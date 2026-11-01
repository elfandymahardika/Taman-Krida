import { storageService } from '../../services/storage.service';
import { Seeder } from './helpers';

/**
 * Dokumen tidak punya data contoh (berkasnya harus diunggah sungguhan).
 * `down` menghapus file fisiknya dulu sebelum barisnya, supaya reset data tidak meninggalkan file yatim.
 */
export default {
  async up() {},

  async down(prisma) {
    const rows = await prisma.document.findMany({ select: { file_key: true } });
    for (const r of rows) await storageService.deleteFile(r.file_key);
    await prisma.document.deleteMany();
  },
} satisfies Seeder;
