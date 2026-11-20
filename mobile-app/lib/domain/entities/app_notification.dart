/// Halaman tujuan saat notifikasi ditekan.
enum NotificationTarget { rental, event, tickets, communities, calendar }

/// Notifikasi untuk akun pengguna.
class AppNotification {
  const AppNotification({
    required this.id,
    required this.symbol,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.target,
    this.targetId,
    this.read = false,
  });

  final String id;

  /// Emoji ikon, mis. "🎟".
  final String symbol;
  final String title;
  final String body;
  final DateTime createdAt;
  final NotificationTarget target;

  /// Kode sewa atau id acara yang dibuka, jika ada.
  final String? targetId;
  final bool read;

  AppNotification markRead() => AppNotification(
    id: id,
    symbol: symbol,
    title: title,
    body: body,
    createdAt: createdAt,
    target: target,
    targetId: targetId,
    read: true,
  );
}
