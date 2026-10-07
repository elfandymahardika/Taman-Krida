import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Tombol teks "Lihat/Sembunyi" di dalam field kata sandi.
class PasswordToggle extends StatelessWidget {
  const PasswordToggle({
    super.key,
    required this.obscure,
    required this.onToggle,
  });

  final bool obscure;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Padding(
        padding: const EdgeInsets.only(right: 16, left: 8),
        child: Text(
          obscure ? 'Lihat' : 'Sembunyi',
          style: AppText.poppins(
            11,
            weight: FontWeight.w600,
            color: AppColors.maroon,
          ),
        ),
      ),
    );
  }
}
