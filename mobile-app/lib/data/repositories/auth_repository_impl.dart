import '../../domain/entities/user_account.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/local/session_local_data_source.dart';
import '../datasources/remote/api_client.dart';
import '../datasources/remote/auth_remote_data_source.dart';
import '../models/user_model.dart';
import 'guard.dart';

/// Akun: memanggil server (remote) dan menyimpan token sesi (local).
class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(this._remote, this._session);

  final AuthRemoteDataSource _remote;
  final SessionLocalDataSource _session;

  Future<void> _saveToken(String? token) async {
    _remote.authToken = token;
    await _session.saveToken(token);
  }

  @override
  Future<UserAccount?> restoreSession() async {
    final token = await _session.readToken();
    if (token == null) return null;
    _remote.authToken = token;
    try {
      return await _remote.currentUser();
    } on ApiException catch (e) {
      // Token kedaluwarsa/dicabut → lupakan. Server mati → coba lagi nanti.
      if (e.status == 401) await _saveToken(null);
      return null;
    }
  }

  Future<UserAccount> _signIn(Future<AuthSessionModel> Function() call) =>
      guard(() async {
        final session = await call();
        await _saveToken(session.token);
        return session.user;
      });

  @override
  Future<UserAccount> login(String email, String password) =>
      _signIn(() => _remote.login(email, password));

  @override
  Future<UserAccount> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) => _signIn(
    () => _remote.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
    ),
  );

  @override
  Future<void> logout() async {
    try {
      await _remote.logout();
    } on ApiException {
      // Sesi sudah tidak berlaku di server: cukup hapus token lokal.
    }
    await _saveToken(null);
  }

  @override
  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) => guard(
    () => _remote.updateProfile(
      name: name,
      email: email,
      phone: phone,
      city: city,
    ),
  );
}
