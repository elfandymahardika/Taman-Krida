import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/constants/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Lambang bulat + tulisan "TKBJ" (navbar: maroon, footer: emas).
class BrandLogo extends StatelessWidget {
  const BrandLogo({super.key, this.onDark = false});

  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SvgPicture.asset(
          onDark ? AppIcons.logoGold : AppIcons.logoMaroon,
          width: 28,
          height: 28,
        ),
        const SizedBox(width: 8),
        Text(
          'TKBJ',
          style: AppText.playfair(
            16,
            weight: FontWeight.w800,
            color: onDark ? AppColors.gold : AppColors.maroon,
          ),
        ),
      ],
    );
  }
}
