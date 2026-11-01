-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(40) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `role_key` ENUM('admin', 'acara', 'keuangan', 'sewa', 'konten') NULL,
    `initials` VARCHAR(4) NOT NULL,
    `status` ENUM('Aktif', 'Nonaktif', 'Undangan', 'Menunggu persetujuan', 'Ditolak') NOT NULL DEFAULT 'Menunggu persetujuan',
    `last_seen_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(200) NULL,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kv` (
    `name` VARCHAR(40) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(60) NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facilities` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `capacity` INTEGER NULL,
    `purpose` VARCHAR(100) NOT NULL,
    `note` VARCHAR(200) NULL,
    `photo` VARCHAR(30) NULL,
    `bookable` BOOLEAN NOT NULL DEFAULT false,
    `sort` INTEGER NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` VARCHAR(40) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `collection` VARCHAR(60) NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('Foto', 'Video') NOT NULL,
    `photo` VARCHAR(30) NULL,
    `file` VARCHAR(100) NULL,
    `mime` VARCHAR(50) NULL,
    `status` ENUM('Terpublikasi', 'Draf') NOT NULL,
    `credit` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `bytes` BIGINT NOT NULL,
    `dims` VARCHAR(40) NULL,
    `created_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contents` (
    `id` VARCHAR(40) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `type` ENUM('Banner beranda', 'Berita', 'Pengumuman', 'Artikel budaya') NOT NULL,
    `author` VARCHAR(60) NOT NULL,
    `status` ENUM('Terpublikasi', 'Terjadwal', 'Draf') NOT NULL,
    `summary` VARCHAR(300) NULL,
    `body` TEXT NULL,
    `cta` VARCHAR(30) NULL,
    `link` VARCHAR(255) NULL,
    `publish_from` DATE NULL,
    `publish_to` DATE NULL,
    `is_hero` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` VARCHAR(40) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `short` VARCHAR(80) NOT NULL,
    `organizer` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `venue` VARCHAR(60) NOT NULL,
    `status` ENUM('Terpublikasi', 'Draf') NOT NULL DEFAULT 'Draf',
    `quota` INTEGER NULL,
    `sold` INTEGER NULL,
    `price` INTEGER NULL,
    `photo` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `events_date`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rentals` (
    `id` VARCHAR(20) NOT NULL,
    `applicant` VARCHAR(100) NOT NULL,
    `venue` VARCHAR(60) NOT NULL,
    `date` DATE NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `activity` VARCHAR(200) NOT NULL,
    `approval` ENUM('Perlu ditinjau', 'Disetujui', 'Ditolak') NOT NULL DEFAULT 'Perlu ditinjau',
    `file` VARCHAR(120) NULL,
    `admin_note` VARCHAR(500) NULL,
    `files_ok` BOOLEAN NOT NULL DEFAULT false,
    `submitted_at` DATETIME(3) NOT NULL,
    `decided_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(20) NOT NULL,
    `type` ENUM('Tiket', 'Sewa gedung') NOT NULL,
    `customer` VARCHAR(100) NOT NULL,
    `event_id` VARCHAR(40) NULL,
    `rental_id` VARCHAR(20) NULL,
    `service` VARCHAR(100) NOT NULL,
    `service_date` DATE NOT NULL,
    `qty` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `payment` ENUM('Lunas', 'Perlu verifikasi', 'Menunggu bayar') NOT NULL,
    `method` VARCHAR(40) NULL,
    `proof_method` VARCHAR(60) NULL,
    `proof_file` VARCHAR(120) NULL,
    `proof_from` VARCHAR(100) NULL,
    `proof_submitted_at` DATETIME(3) NULL,
    `note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `paid_at` DATETIME(3) NULL,

    INDEX `event_id`(`event_id`),
    INDEX `orders_created_at`(`created_at`),
    INDEX `rental_id`(`rental_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communities` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(40) NOT NULL,
    `city` VARCHAR(60) NOT NULL,
    `members` INTEGER NOT NULL DEFAULT 0,
    `contact` VARCHAR(20) NOT NULL,
    `photo` VARCHAR(30) NULL,
    `status` ENUM('Aktif', 'Nonaktif', 'Menunggu persetujuan', 'Ditolak') NOT NULL,
    `leader` VARCHAR(100) NULL,
    `since` VARCHAR(40) NULL,
    `admin_note` VARCHAR(500) NULL,
    `applied_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_monthly` (
    `month` CHAR(7) NOT NULL,
    `sales_ticket` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `sales_rental` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `p_stage` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `p_artist` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `p_maintenance` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `p_promo` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,

    PRIMARY KEY (`month`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kind` ENUM('payment', 'event', 'rental', 'community', 'content', 'gallery', 'user', 'system') NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `sub` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    INDEX `activity_created_at`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(255) NOT NULL,
    `link` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `read_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` VARCHAR(500) NULL,
    `status` ENUM('Draf', 'Terpublikasi', 'Diarsipkan') NOT NULL DEFAULT 'Draf',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `file_key` VARCHAR(500) NOT NULL,
    `file_type` VARCHAR(100) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_key`(`file_key`),
    INDEX `idx_documents_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitors` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(60) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `city` VARCHAR(60) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_sessions` (
    `id` CHAR(36) NOT NULL,
    `visitor_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `user_agent` VARCHAR(200) NULL,

    INDEX `visitor_id`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_orders` (
    `order_id` VARCHAR(20) NOT NULL,
    `visitor_id` BIGINT NOT NULL,
    `booking_code` VARCHAR(20) NOT NULL,
    `buyer_email` VARCHAR(100) NOT NULL,
    `buyer_phone` VARCHAR(20) NOT NULL,
    `notified_status` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    INDEX `visitor_id`(`visitor_id`),
    INDEX `visitor_orders_booking_code`(`booking_code`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_rentals` (
    `rental_id` VARCHAR(20) NOT NULL,
    `visitor_id` BIGINT NOT NULL,
    `contact` VARCHAR(20) NOT NULL,
    `notified_status` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    INDEX `visitor_id`(`visitor_id`),
    PRIMARY KEY (`rental_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_files` (
    `id` CHAR(36) NOT NULL,
    `visitor_id` BIGINT NOT NULL,
    `kind` ENUM('ktp', 'surat', 'proposal', 'bukti') NOT NULL,
    `ref` VARCHAR(20) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `file_key` VARCHAR(100) NOT NULL,
    `mime` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `file_key`(`file_key`),
    INDEX `visitor_files_ref`(`ref`),
    INDEX `visitor_id`(`visitor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_communities` (
    `community_id` VARCHAR(50) NOT NULL,
    `visitor_id` BIGINT NOT NULL,
    `address` VARCHAR(200) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `notified_status` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    INDEX `visitor_id`(`visitor_id`),
    PRIMARY KEY (`community_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `visitor_id` BIGINT NOT NULL,
    `symbol` VARCHAR(8) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `body` VARCHAR(255) NOT NULL,
    `target` ENUM('rental', 'event', 'tickets', 'communities', 'calendar') NOT NULL,
    `target_id` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL,
    `read_at` DATETIME(3) NULL,

    INDEX `visitor_notifications_visitor_id_id`(`visitor_id`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_sessions` ADD CONSTRAINT `visitor_sessions_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_orders` ADD CONSTRAINT `visitor_orders_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_rentals` ADD CONSTRAINT `visitor_rentals_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_files` ADD CONSTRAINT `visitor_files_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_communities` ADD CONSTRAINT `visitor_communities_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `visitor_notifications` ADD CONSTRAINT `visitor_notifications_ibfk_1` FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

