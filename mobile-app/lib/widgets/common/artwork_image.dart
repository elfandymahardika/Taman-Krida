import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Foto dari aset lokal. Jika file belum tersedia (mis. foto Figma yang
/// belum diekspor), tampil sampul gradien maroon dengan simbol emas.
class ArtworkImage extends StatelessWidget {
  const ArtworkImage(
    this.asset, {
    super.key,
    this.width,
    this.height,
    this.radius = 0,
    this.cacheWidth = 600,
    this.alignment = Alignment.center,
  });

  final String asset;
  final double? width;
  final double? height;
  final double radius;
  final int cacheWidth;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.asset(
        asset,
        width: width,
        height: height,
        fit: BoxFit.cover,
        alignment: alignment,
        cacheWidth: cacheWidth,
        errorBuilder: (context, error, stackTrace) =>
            _Placeholder(width: width, height: height),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({this.width, this.height});

  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      alignment: Alignment.center,
      decoration: const BoxDecoration(gradient: AppGradients.tentangBanner),
      child: Text(
        '❖',
        style: AppText.poppins(
          24,
          color: AppColors.gold.withValues(alpha: 0.7),
        ),
      ),
    );
  }
}
