import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

enum AppButtonVariant {
  /// Latar maroon, teks putih.
  primary,

  /// Garis maroon, teks maroon.
  outline,

  /// Latar emas, teks maroon tua (hero beranda).
  gold,

  /// Garis putih, teks putih (di atas latar gelap).
  outlineLight,
}

/// Tombol lebar penuh yang dipakai di seluruh layar.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.fontSize = 14,
    this.verticalPadding = 12,
    this.borderWidth = 1,
    this.radius = 8,
  });

  const AppButton.outline({
    super.key,
    required this.label,
    required this.onPressed,
    this.fontSize = 14,
    this.verticalPadding = 12,
    this.borderWidth = 1,
    this.radius = 8,
  }) : variant = AppButtonVariant.outline;

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final double fontSize;
  final double verticalPadding;
  final double borderWidth;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final (background, foreground, borderColor) = switch (variant) {
      AppButtonVariant.primary => (AppColors.maroon, AppColors.white, null),
      AppButtonVariant.outline => (
        Colors.transparent,
        AppColors.maroon,
        AppColors.maroon,
      ),
      AppButtonVariant.gold => (AppColors.gold, AppColors.maroonDark, null),
      AppButtonVariant.outlineLight => (
        Colors.transparent,
        AppColors.white,
        AppColors.white,
      ),
    };
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
      side: borderColor == null
          ? BorderSide.none
          : BorderSide(color: borderColor, width: borderWidth),
    );

    return Opacity(
      opacity: onPressed == null ? 0.5 : 1,
      child: Material(
        color: background,
        shape: shape,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 16,
              vertical: verticalPadding,
            ),
            child: Center(
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: AppText.poppins(
                  fontSize,
                  weight: FontWeight.w600,
                  color: foreground,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
