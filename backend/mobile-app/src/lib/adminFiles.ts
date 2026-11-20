import { config } from '../config/env';

/**
 * URL berkas unggahan admin (foto galeri, gambar acara) untuk aplikasi: blob publik = URL apa adanya;
 * blob privat (/uploads/<folder>/<nama>) dan berkas lokal (/uploads/<nama>) disajikan API dashboard.
 */
export const adminFileUrl = (file: string) => {
  if (!/^https?:\/\//.test(file)) return `${config.adminPublicUrl}/uploads/${file}`;
  return process.env.BLOB_ACCESS === 'public' ? file : `${config.adminPublicUrl}/uploads${new URL(file).pathname}`;
};
