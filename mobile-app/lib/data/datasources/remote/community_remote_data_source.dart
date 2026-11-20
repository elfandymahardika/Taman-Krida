import '../../../domain/entities/community.dart';
import '../../models/community_model.dart';
import '../../models/json.dart';
import 'api_client.dart';

/// Sumber data pendaftaran komunitas milik akun.
abstract interface class CommunityRemoteDataSource {
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  );
  Future<List<CommunityRegistration>> myCommunities();
}

class CommunityRemoteDataSourceImpl implements CommunityRemoteDataSource {
  CommunityRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  @override
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  ) async => CommunityRegistrationModel.fromJson(
    await _api.post(
      '/communities',
      CommunityRegistrationModel.toJson(registration),
    ) as Json,
  );

  @override
  Future<List<CommunityRegistration>> myCommunities() async {
    final list = await _api.get('/me/communities') as List;
    return list.cast<Json>().map(CommunityRegistrationModel.fromJson).toList();
  }
}
