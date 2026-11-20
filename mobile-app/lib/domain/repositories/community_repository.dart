import '../entities/community.dart';

/// Kontrak pendaftaran komunitas milik akun.
abstract interface class CommunityRepository {
  Future<CommunityRegistration> registerCommunity(
    CommunityRegistration registration,
  );
  Future<List<CommunityRegistration>> getMyCommunities();
}
