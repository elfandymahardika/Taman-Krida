import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Label kecil berlatar transparan, mis. kategori "Wayang" atau "LUNAS".
class PillBadge extends StatelessWidget {
  const PillBadge(
    this.label, {
    super.key,
    this.color = AppColors.gold,
    this.background = AppColors.goldTint,
    this.fontSize = 9,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    this.radius = 10,
    this.weight = FontWeight.w600,
  });

  final String label;
  final Color color;
  final Color background;
  final double fontSize;
  final EdgeInsetsGeometry padding;
  final double radius;
  final FontWeight weight;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(radius),
      ),
      child: Text(
        label,
        style: AppText.poppins(fontSize, weight: weight, color: color),
      ),
    );
  }
}
