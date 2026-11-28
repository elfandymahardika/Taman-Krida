-- Video materi Edukasi: berkas unggahan (video_file, folder blob "edukasi") atau tautan YouTube/URL video (video_link).
-- Durasi contoh dari data awal dikosongkan karena keenam materi belum punya video sungguhan.

-- AlterTable
ALTER TABLE `culture_topics` ADD COLUMN `video_file` VARCHAR(500) NULL,
    ADD COLUMN `video_link` VARCHAR(500) NULL;


-- Durasi tanpa video tidak ditampilkan lagi di aplikasi.
UPDATE `culture_topics` SET `video_minutes` = 0 WHERE `video_file` IS NULL AND `video_link` IS NULL;
