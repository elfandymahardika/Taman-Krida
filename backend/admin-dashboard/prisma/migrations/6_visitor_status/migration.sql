-- Akun pengunjung aplikasi mobile bisa dinonaktifkan admin (dashboard → Akun pengunjung).
-- Akun Nonaktif tidak bisa login dan sesinya dicabut; data pesanan/sewa tetap tersimpan.

-- AlterTable
ALTER TABLE `visitors` ADD COLUMN `disabled_at` DATETIME(3) NULL,
    ADD COLUMN `disabled_note` VARCHAR(200) NULL,
    ADD COLUMN `status` ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif';

