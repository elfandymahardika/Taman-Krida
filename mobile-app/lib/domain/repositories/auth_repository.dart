import '../entities/user_account.dart';

/// Kontrak akun pengunjung: login, daftar, profil, dan sesi tersimpan.
abstract interface class AuthRepository {
  /// Akun dari sesi login sebelumnya, atau `null` bila belum/tidak berlaku.
  Future<UserAccount?> restoreSession();

  Future<UserAccount> login(String email, String password);

  Future<UserAccount> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  });

  Future<void> logout();

  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  });
}
