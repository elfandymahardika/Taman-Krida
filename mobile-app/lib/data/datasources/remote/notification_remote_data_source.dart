import '../../../domain/entities/app_notification.dart';
import '../../models/app_notification_model.dart';
import '../../models/json.dart';
import 'api_client.dart';

/// Sumber data notifikasi akun.
abstract interface class NotificationRemoteDataSource {
  Future<List<AppNotification>> notifications();
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();
}

class NotificationRemoteDataSourceImpl implements NotificationRemoteDataSource {
  NotificationRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<AppNotification>> notifications() async {
    final json = await _api.get('/notifications') as Json;
    return (json['items'] as List)
        .cast<Json>()
        .map(AppNotificationModel.fromJson)
        .toList();
  }

  @override
  Future<void> markNotificationRead(String id) =>
      _api.post('/notifications/$id/read');

  @override
  Future<void> markAllNotificationsRead() =>
      _api.post('/notifications/read-all');
}
