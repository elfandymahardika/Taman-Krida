/// Controller yang menyimpan data milik akun login (tiket, sewa, komunitas,
/// notifikasi). Dimuat ulang dan dikosongkan oleh `AuthController`.
abstract interface class AccountDataController {
  /// Melempar `Failure` bila gagal (mis. sesi tidak berlaku).
  Future<void> load();

  void clear();
}
