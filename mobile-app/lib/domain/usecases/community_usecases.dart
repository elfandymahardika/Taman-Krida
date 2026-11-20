import '../entities/community.dart';
import '../repositories/community_repository.dart';

class GetMyCommunitiesUseCase {
  const GetMyCommunitiesUseCase(this._repository);

  final CommunityRepository _repository;

  Future<List<CommunityRegistration>> call() => _repository.getMyCommunities();
}

/// Kirim pendaftaran komunitas → menunggu persetujuan admin.
class RegisterCommunityUseCase {
  const RegisterCommunityUseCase(this._repository);

  final CommunityRepository _repository;

  Future<CommunityRegistration> call(CommunityRegistration registration) =>
      _repository.registerCommunity(registration);
}
