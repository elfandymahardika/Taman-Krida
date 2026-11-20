-- Gambar acara unggahan admin: nama berkas di uploads/ atau URL Vercel Blob (folder "acara").
-- AlterTable
ALTER TABLE `events` ADD COLUMN `image` VARCHAR(500) NULL;
