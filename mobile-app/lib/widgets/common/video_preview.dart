import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'artwork_image.dart';

/// Sampul video dengan tombol putar (pemutar video belum ada di prototipe).
class VideoPreview extends StatelessWidget {
  const VideoPreview({
    super.key,
    required this.cover,
    required this.minutes,
    required this.onPlay,
    this.caption,
  });

  final String cover;
  final int minutes;
  final VoidCallback onPlay;
  final String? caption;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Putar video',
      child: GestureDetector(
        onTap: onPlay,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Stack(
            fit: StackFit.expand,
            children: [
              ArtworkImage(cover, cacheWidth: 1000),
              const ColoredBox(color: Color(0x731A0F0C)),
              Center(
                child: Container(
                  width: 56,
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Text(
                      '▶',
                      style: AppText.poppins(20, color: AppColors.maroon),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 12,
                bottom: 12,
                right: 12,
                child: Text(
                  caption ?? 'Video dokumentasi · $minutes menit',
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
