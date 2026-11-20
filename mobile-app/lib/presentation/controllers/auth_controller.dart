import 'package:flutter/foundation.dart';

import '../../core/error/failure.dart';
import '../../domain/entities/user_account.dart';
import '../../domain/usecases/auth_usecases.dart';
import 'account_data_controller.dart';
import 'notification_controller.dart';

/// Sesi login & profil, serta memuat ulang data milik akun.
class AuthController extends ChangeNotifier {
  AuthController({
    required this._restoreSession,
    required this._login,
    required this._register,
    required this._updateProfile,
    required this._logout,
    required this._notifications,
    required this._accountData,
  });

  final RestoreSessionUseCase _restoreSession;
  final LoginUseCase _login;
  final RegisterUseCase _register;
  final UpdateProfileUseCase _updateProfile;
  final LogoutUseCase _logout;
  final NotificationController _notifications;
  final List<AccountDataController> _accountData;

  UserAccount? _currentUser;

  UserAccount? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  /// Sedang memuat tiket, sewa, komunitas, dan notifikasi milik akun.
  bool accountLoading = false;

  /// Pulihkan sesi login sebelumnya (token tersimpan).
  Future<void> restoreSession() async {
    try {
      final user = await _restoreSession();
      if (user == null) return;
      _currentUser = user;
      notifyListeners();
      await refreshAccount();
    } on Failure {
      // Server tidak bisa dihubungi: tetap jalan sebagai tamu.
    }
  }

  /// Mengembalikan pesan error, atau `null` jika login berhasil.
  Future<String?> login(String email, String password) =>
      _signIn(() => _login(email, password));

  /// Mendaftarkan akun baru lalu langsung login.
  Future<String?> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) => _signIn(
    () => _register(name: name, email: email, phone: phone, password: password),
  );

  Future<String?> _signIn(Future<UserAccount> Function() call) async {
    try {
      _currentUser = await call();
    } on Failure catch (e) {
      return e.displayMessage;
    }
    notifyListeners();
    await refreshAccount();
    return null;
  }

  Future<String?> updateProfile({
    required String name,
    required String email,
    required String phone,
    required String city,
  }) async {
    try {
      _currentUser = await _updateProfile(
        name: name,
        email: email,
        phone: phone,
        city: city,
      );
    } on Failure catch (e) {
      return e.displayMessage;
    }
    notifyListeners();
    return null;
  }

  Future<void> logout() async {
    await _logout();
    _clearAccount();
  }

  /// Muat ulang tiket, sewa, komunitas, dan notifikasi milik akun. Keputusan
  /// admin terbaru (lunas, disetujui, ditolak) ikut terbawa.
  Future<void> refreshAccount() async {
    if (!isLoggedIn) return;
    accountLoading = true;
    notifyListeners();
    try {
      // Notifikasi dulu: server menyinkronkan keputusan admin saat dibaca.
      await _notifications.load();
      await Future.wait([for (final vm in _accountData) vm.load()]);
    } on Failure catch (e) {
      if (e.isUnauthorized) {
        accountLoading = false;
        _clearAccount();
        return;
      }
    }
    accountLoading = false;
    notifyListeners();
  }

  void _clearAccount() {
    _currentUser = null;
    _notifications.clear();
    for (final vm in _accountData) {
      vm.clear();
    }
    notifyListeners();
  }
}
