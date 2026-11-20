import 'package:flutter/foundation.dart';

import '../../domain/entities/community.dart';
import '../../domain/usecases/community_usecases.dart';
import 'account_data_controller.dart';
import 'notification_controller.dart';

/// Pendaftaran komunitas milik akun.
class CommunityController extends ChangeNotifier
    implements AccountDataController {
  CommunityController({
    required this._getMyCommunities,
    required this._registerCommunity,
    required this._notifications,
  });

  final GetMyCommunitiesUseCase _getMyCommunities;
  final RegisterCommunityUseCase _registerCommunity;
  final NotificationController _notifications;

  List<CommunityRegistration> _registrations = [];

  List<CommunityRegistration> get registrations =>
      List.unmodifiable(_registrations);

  /// Kirim pendaftaran → menunggu persetujuan admin. Melempar `Failure`.
  Future<void> register(CommunityRegistration registration) async {
    final saved = await _registerCommunity(registration);
    _registrations = [saved, ..._registrations];
    notifyListeners();
    _notifications.refreshQuietly();
  }

  @override
  Future<void> load() async {
    _registrations = await _getMyCommunities();
    notifyListeners();
  }

  @override
  void clear() {
    _registrations = [];
    notifyListeners();
  }
}
