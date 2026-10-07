import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Dua keluarga huruf pada desain: Poppins (teks isi) dan
/// Playfair Display (judul).
abstract final class AppText {
  static const poppinsFamily = 'Poppins';
  static const playfairFamily = 'PlayfairDisplay';

  /// Font cadangan untuk simbol (◆ ✓ →) dan emoji (🎟 🔔).
  static const fallbackFamilies = [
    'TkbjSymbolsMath',
    'TkbjSymbols2',
    'Noto Color Emoji',
    'Apple Color Emoji',
    'Segoe UI Emoji',
  ];

  static TextStyle poppins(
    double size, {
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.ink,
    double? height,
    FontStyle? fontStyle,
  }) {
    return TextStyle(
      fontFamily: poppinsFamily,
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      fontStyle: fontStyle,
      fontFamilyFallback: fallbackFamilies,
    );
  }

  static TextStyle playfair(
    double size, {
    FontWeight weight = FontWeight.w700,
    Color color = AppColors.ink,
    double? height,
  }) {
    return TextStyle(
      fontFamily: playfairFamily,
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: height,
      fontFamilyFallback: fallbackFamilies,
    );
  }
}
