import '../entities/app_notification.dart';

/// Kontrak notifikasi akun.
abstract interface class NotificationRepository {
  Future<List<AppNotification>> getNotifications();
  Future<void> markRead(String id);
  Future<void> markAllRead();
}
