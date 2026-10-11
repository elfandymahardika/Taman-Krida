import '../models/app_notification.dart';

/// Notifikasi awal akun demo (isi mengikuti desain Figma).
abstract final class NotificationData {
  static List<AppNotification> seed(DateTime now) => [
    AppNotification(
      id: 'n1',
      symbol: '✅',
      title: 'Pengajuan sewa disetujui',
      body:
          'SG-1026-0019 · Pendopo Agung TKBJ disetujui admin. Selesaikan '
          'pembayaran dalam 2×24 jam.',
      createdAt: now,
      target: NotificationTarget.rental,
      targetId: 'SG-1026-0019',
    ),
    AppNotification(
      id: 'n2',
      symbol: '⏰',
      title: 'Pengingat acara besok',
      body:
          'Wayang Kulit: Lakon Bima Bungkus · Rabu 19:30 WIB di Panggung '
          'Terbuka.',
      createdAt: now.subtract(const Duration(hours: 1)),
      target: NotificationTarget.event,
      targetId: 'wayang-bima-bungkus',
    ),
    AppNotification(
      id: 'n3',
      symbol: '🎟',
      title: 'E-tiket telah terbit',
      body: 'Kode TKBJ-A1B2C3 untuk 2 tiket Wayang Kulit sudah tersedia.',
      createdAt: now.subtract(const Duration(days: 1)),
      target: NotificationTarget.tickets,
      read: true,
    ),
    AppNotification(
      id: 'n4',
      symbol: '👥',
      title: 'Pendaftaran komunitas ditinjau',
      body: 'Data sanggar Anda sedang diverifikasi admin (1–3 hari kerja).',
      createdAt: now.subtract(const Duration(days: 2)),
      target: NotificationTarget.communities,
      read: true,
    ),
    AppNotification(
      id: 'n5',
      symbol: '📅',
      title: 'Acara baru di kalender',
      body: 'Festival Seni Tradisi Jawa Timur ditambahkan untuk Juli 2026.',
      createdAt: now.subtract(const Duration(days: 3)),
      target: NotificationTarget.calendar,
      read: true,
    ),
  ];
}
