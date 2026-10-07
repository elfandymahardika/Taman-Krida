import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Baris label (kiri) dan nilai (kanan) untuk ringkasan data.
class InfoRow extends StatelessWidget {
  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.fontSize = 12,
    this.labelStyle,
    this.valueStyle,
    this.onValueTap,
  });

  final String label;
  final String value;
  final double fontSize;
  final TextStyle? labelStyle;
  final TextStyle? valueStyle;
  final VoidCallback? onValueTap;

  @override
  Widget build(BuildContext context) {
    final valueText = Text(
      value,
      textAlign: TextAlign.right,
      style: valueStyle ?? AppText.poppins(fontSize, weight: FontWeight.w600),
    );
    // Label mengambil sisa ruang; nilai selebar isinya, maksimal 60% baris,
    // sehingga teks panjang di salah satu sisi tidak memotong sisi lain.
    return LayoutBuilder(
      builder: (context, constraints) => Row(
        children: [
          Expanded(
            child: Text(
              label,
              style:
                  labelStyle ??
                  AppText.poppins(fontSize, color: AppColors.muted),
            ),
          ),
          const SizedBox(width: 12),
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: constraints.maxWidth * 0.6),
            child: onValueTap == null
                ? valueText
                : GestureDetector(onTap: onValueTap, child: valueText),
          ),
        ],
      ),
    );
  }
}

/// Garis pemisah tipis 1px warna #F2E8DF.
class ThinDivider extends StatelessWidget {
  const ThinDivider({super.key, this.color = AppColors.divider});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(height: 1, color: color);
  }
}
