import 'package:flutter/material.dart';

/// Token warna sesuai desain Figma TKBJ (halaman "mobile").
abstract final class AppColors {
  static const maroon = Color(0xFF7A2E2E);
  static const maroonDark = Color(0xFF471313);
  static const gold = Color(0xFFC9A227);
  static const cream = Color(0xFFFDF8F0);
  static const ink = Color(0xFF2B211B);
  static const muted = Color(0xFF6B615C);
  static const border = Color(0xFFEADCC9);
  static const divider = Color(0xFFF2E8DF);
  static const blush = Color(0xFFF2E5DE);
  static const success = Color(0xFF3A9D4F);
  static const error = Color(0xFFB3261E);
  static const white = Colors.white;

  /// Maroon 10% untuk latar ikon & tanggal.
  static const maroonTint = Color(0x1A7A2E2E);

  /// Emas 15% untuk badge kategori & catatan.
  static const goldTint = Color(0x26C9A227);

  /// Latar gelap di belakang bottom sheet (55%).
  static const backdrop = Color(0x8C1A0F0C);

  static const cardShadow = Color(0x0A4D261A);
  static const navShadow = Color(0x0F4D261A);
  static const footerDivider = Color(0x21FFFFFF);
  static const footerText = Color(0xCCF2E5DE);
}

/// Gradien yang dipakai berulang di beberapa layar.
abstract final class AppGradients {
  static const pageHeader = LinearGradient(
    colors: [AppColors.maroon, AppColors.maroonDark],
  );

  static const hero = LinearGradient(
    colors: [Color(0xCC7A2E2E), Color(0xCC471313)],
  );

  static const profilHeader = LinearGradient(
    colors: [
      Color(0xC2BA3939),
      Color(0xC28F2A2A),
      Color(0xC25E1F1F),
      Color(0xC2471313),
    ],
    stops: [0, 0.2856, 0.5524, 1],
  );

  static const tentangBanner = LinearGradient(
    colors: [Color(0xFF993D33), Color(0xFF4D1A14)],
  );
}
