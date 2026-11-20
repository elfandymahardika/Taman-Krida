import '../entities/app_notification.dart';
import '../repositories/notification_repository.dart';

class GetNotificationsUseCase {
  const GetNotificationsUseCase(this._repository);

  final NotificationRepository _repository;

  Future<List<AppNotification>> call() => _repository.getNotifications();
}

class MarkNotificationReadUseCase {
  const MarkNotificationReadUseCase(this._repository);

  final NotificationRepository _repository;

  Future<void> call(String id) => _repository.markRead(id);
}

class MarkAllNotificationsReadUseCase {
  const MarkAllNotificationsReadUseCase(this._repository);

  final NotificationRepository _repository;

  Future<void> call() => _repository.markAllRead();
}
