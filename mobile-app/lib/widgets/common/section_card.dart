import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Kotak putih bergaris dengan judul, mis. "Jadwal Latihan" atau
/// "Ringkasan Pengajuan".
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.children,
    this.title,
    this.borderColor = AppColors.divider,
    this.borderWidth = 1,
    this.background = AppColors.white,
    this.spacing = 10,
  });

  final String? title;
  final List<Widget> children;
  final Color borderColor;
  final double borderWidth;
  final Color background;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: borderWidth),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (title != null) ...[
            Text(title!, style: AppText.playfair(16)),
            SizedBox(height: spacing + 2),
          ],
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) SizedBox(height: spacing),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// Kotak berwarna dengan ikon di kiri, mis. "Jadwal tersedia!".
class NoticeBanner extends StatelessWidget {
  const NoticeBanner({
    super.key,
    required this.message,
    this.leading,
    this.color = AppColors.success,
  });

  final String message;

  /// Simbol di kiri. `null` menampilkan lingkaran "i" (info).
  final String? leading;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 14,
            child: leading == null
                ? Container(
                    margin: const EdgeInsets.only(top: 3),
                    height: 14,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: color, width: 1.2),
                    ),
                    child: Text(
                      'i',
                      style: AppText.poppins(
                        9,
                        weight: FontWeight.w700,
                        color: color,
                        height: 1,
                      ),
                    ),
                  )
                : Text(
                    leading!,
                    style: AppText.poppins(
                      14,
                      weight: FontWeight.w700,
                      color: color,
                    ),
                  ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: AppText.poppins(12, weight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
