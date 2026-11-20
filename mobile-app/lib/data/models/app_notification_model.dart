import '../../domain/entities/app_notification.dart';
import 'json.dart';

/// Notifikasi akun dari GET /api/notifications.
class AppNotificationModel extends AppNotification {
  const AppNotificationModel({
    required super.id,
    required super.symbol,
    required super.title,
    required super.body,
    required super.createdAt,
    required super.target,
    super.targetId,
    super.read,
  });

  factory AppNotificationModel.fromJson(Json j) => AppNotificationModel(
    id: '${j['id']}',
    symbol: j['symbol'] as String,
    title: j['title'] as String,
    body: j['body'] as String,
    createdAt: parseDate(j['createdAt']),
    target: NotificationTarget.values.byName(j['target'] as String),
    targetId: j['targetId'] as String?,
    read: j['read'] as bool,
  );
}
