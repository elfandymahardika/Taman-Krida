import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_text_styles.dart';

abstract final class AppTheme {
  static ThemeData get light {
    OutlineInputBorder fieldBorder(Color color) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: color, width: 1.5),
    );

    return ThemeData(
      useMaterial3: true,
      fontFamily: AppText.poppinsFamily,
      scaffoldBackgroundColor: AppColors.cream,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.maroon,
        primary: AppColors.maroon,
        secondary: AppColors.gold,
        surface: AppColors.white,
        error: AppColors.error,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        hintStyle: AppText.poppins(13, color: AppColors.muted),
        errorStyle: AppText.poppins(11, color: AppColors.error),
        errorMaxLines: 2,
        border: fieldBorder(AppColors.border),
        enabledBorder: fieldBorder(AppColors.border),
        focusedBorder: fieldBorder(AppColors.maroon),
        errorBorder: fieldBorder(AppColors.error),
        focusedErrorBorder: fieldBorder(AppColors.error),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.ink,
        contentTextStyle: AppText.poppins(12, color: AppColors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: AppColors.white,
        headerBackgroundColor: AppColors.maroon,
        headerForegroundColor: AppColors.white,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 68,
        backgroundColor: AppColors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.maroonTint,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected)
                ? AppColors.maroon
                : AppColors.muted,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? AppText.poppins(
                  11,
                  weight: FontWeight.w600,
                  color: AppColors.maroon,
                )
              : AppText.poppins(11, color: AppColors.muted),
        ),
      ),
      // Transisi antarlayar ala aplikasi native di tiap platform.
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: FadeForwardsPageTransitionsBuilder(),
        },
      ),
    );
  }
}
