import '../../domain/entities/app_notification.dart';
import '../../domain/repositories/notification_repository.dart';
import '../datasources/remote/notification_remote_data_source.dart';
import 'guard.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  const NotificationRepositoryImpl(this._remote);

  final NotificationRemoteDataSource _remote;

  @override
  Future<List<AppNotification>> getNotifications() =>
      guard(_remote.notifications);

  @override
  Future<void> markRead(String id) =>
      guard(() => _remote.markNotificationRead(id));

  @override
  Future<void> markAllRead() => guard(_remote.markAllNotificationsRead);
}
