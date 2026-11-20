import '../../domain/entities/community.dart';
import '../../domain/repositories/community_repository.dart';
import '../datasources/remote/community_remote_data_source.dart';
import 'guard.dart';

class CommunityRepositoryImpl implements CommunityRepository {
  const CommunityRepositoryImpl(this._remote);

  final CommunityRemoteDataSource _remote;

  @override
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  ) => guard(() => _remote.registerCommunity(registration));

  @override
  Future<List<CommunityRegistration>> getMyCommunities() =>
      guard(_remote.myCommunities);
}
