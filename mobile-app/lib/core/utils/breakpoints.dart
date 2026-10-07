/// Batas lebar untuk tata letak responsif (ponsel kecil, ponsel besar, tablet).
abstract final class Breakpoints {
  /// Lebar maksimum konten agar teks tetap nyaman dibaca di tablet/landscape.
  static const double maxContentWidth = 720;

  /// Lebar minimum satu kartu sebelum grid menambah kolom.
  static const double minCardWidth = 300;

  static const double tablet = 600;
}
