import 'package:flutter/foundation.dart';

import '../../core/error/failure.dart';
import '../../domain/entities/app_notification.dart';
import '../../domain/usecases/notification_usecases.dart';
import 'account_data_controller.dart';

/// Notifikasi milik akun.
class NotificationController extends ChangeNotifier
    implements AccountDataController {
  NotificationController({
    required this._getNotifications,
    required this._markRead,
    required this._markAllRead,
  });

  final GetNotificationsUseCase _getNotifications;
  final MarkNotificationReadUseCase _markRead;
  final MarkAllNotificationsReadUseCase _markAllRead;

  List<AppNotification> _notifications = [];

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.read).length;

  @override
  Future<void> load() async {
    _notifications = await _getNotifications();
    notifyListeners();
  }

  /// Muat ulang tanpa mengganggu layar (galat diabaikan).
  Future<void> refreshQuietly() async {
    try {
      await load();
    } on Failure {
      // Notifikasi lama tetap tampil.
    }
  }

  @override
  void clear() {
    _notifications = [];
    notifyListeners();
  }

  void markRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index < 0 || _notifications[index].read) return;
    _notifications = List.of(_notifications)
      ..[index] = _notifications[index].markRead();
    notifyListeners();
    _markRead(id).catchError((_) {});
  }

  void markAllRead() {
    _notifications = [for (final n in _notifications) n.markRead()];
    notifyListeners();
    _markAllRead().catchError((_) {});
  }
}
