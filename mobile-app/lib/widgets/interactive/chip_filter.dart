import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Chip filter kategori (komponen "Chip Filter": Default / Aktif).
class ChipFilter extends StatelessWidget {
  const ChipFilter({
    super.key,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: active ? AppColors.maroon : AppColors.white,
      shape: StadiumBorder(
        side: active
            ? BorderSide.none
            : const BorderSide(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Text(
            label,
            style: AppText.poppins(
              12,
              weight: FontWeight.w500,
              color: active ? AppColors.white : AppColors.ink,
            ),
          ),
        ),
      ),
    );
  }
}
