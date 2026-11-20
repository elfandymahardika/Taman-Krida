import 'package:shared_preferences/shared_preferences.dart';

/// Penyimpanan token login agar sesi tetap ada saat aplikasi dibuka ulang.
abstract interface class SessionLocalDataSource {
  Future<String?> readToken();

  /// `null` = hapus token (logout / sesi tidak berlaku).
  Future<void> saveToken(String? token);
}

/// Token disimpan di SharedPreferences perangkat.
class SessionLocalDataSourceImpl implements SessionLocalDataSource {
  static const _tokenKey = 'tkbj_token';

  @override
  Future<String?> readToken() async =>
      (await SharedPreferences.getInstance()).getString(_tokenKey);

  @override
  Future<void> saveToken(String? token) async {
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }
}

/// Token hanya di memori: mode demo & test (sesi hilang saat aplikasi ditutup).
class InMemorySessionLocalDataSource implements SessionLocalDataSource {
  String? _token;

  @override
  Future<String?> readToken() async => _token;

  @override
  Future<void> saveToken(String? token) async => _token = token;
}
