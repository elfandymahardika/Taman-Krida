-- Data aplikasi mobile yang sebelumnya dikunci di kode kini diatur admin di dashboard:
-- tarif sewa per area, kategori acara, dan profil komunitas (deskripsi, alamat, jadwal latihan, jumlah pentas).

-- AlterTable
ALTER TABLE `facilities` ADD COLUMN `rental_rate` INTEGER NULL;

-- AlterTable
ALTER TABLE `events` ADD COLUMN `category` VARCHAR(30) NULL;

-- AlterTable
ALTER TABLE `communities` ADD COLUMN `address` VARCHAR(200) NULL,
    ADD COLUMN `description` VARCHAR(500) NULL,
    ADD COLUMN `performances` VARCHAR(40) NULL,
    ADD COLUMN `schedule` VARCHAR(300) NULL;


-- Tarif yang sebelumnya tertulis di kode kedua backend (RENTAL_RATES).
UPDATE `facilities` SET `rental_rate` = 2500000 WHERE `name` = 'Pendopo Agung TKBJ';
UPDATE `facilities` SET `rental_rate` = 2000000 WHERE `name` = 'Panggung Terbuka';
UPDATE `facilities` SET `rental_rate` = 1500000 WHERE `name` = 'Gedung Kesenian & Galeri';

-- Deskripsi & alamat yang diisi pengunjung saat mendaftarkan komunitas lewat aplikasi.
UPDATE `communities` c JOIN `visitor_communities` v ON v.`community_id` = c.`id`
SET c.`description` = v.`description`, c.`address` = v.`address`;
