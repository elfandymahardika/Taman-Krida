import '../../../domain/entities/user_account.dart';
import '../../models/json.dart';
import '../../models/user_model.dart';
import 'api_client.dart';

/// Sumber data akun. Melempar `ApiException` bila server menolak.
abstract interface class AuthRemoteDataSource {
  /// Token sesi yang dikirim pada setiap permintaan berikutnya.
  set authToken(String? token);

  Future<AuthSessionModel> login(String email, String password);

  Future<AuthSessionModel> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  });

  /// Akun pemilik token saat ini (GET /auth/me).
  Future<UserAccount> currentUser();

  Future<void> logout();

  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  });
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl(this._api);

  final ApiClient _api;

  @override
  set authToken(String? token) => _api.token = token;

  @override
  Future<AuthSessionModel> login(String email, String password) async =>
      AuthSessionModel.fromJson(
        await _api.post('/auth/login', {'email': email, 'password': password})
            as Json,
      );

  @override
  Future<AuthSessionModel> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async => AuthSessionModel.fromJson(
    await _api.post('/auth/register', {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    }) as Json,
  );

  @override
  Future<UserAccount> currentUser() async {
    final json = await _api.get('/auth/me') as Json;
    return UserModel.fromJson(json['user'] as Json);
  }

  @override
  Future<void> logout() => _api.post('/auth/logout');

  @override
  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    final json = await _api.put('/auth/me', {
      'name': name,
      'email': email,
      'phone': phone,
      'city': city,
    }) as Json;
    return UserModel.fromJson(json['user'] as Json);
  }
}
