import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../domain/entities/cultural_event.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/artwork_image.dart';
import '../../../widgets/common/pill_badge.dart';

/// Kartu acara pada kalender: tanggal, foto, kategori, judul, lokasi.
/// Seluruh kartu dapat ditekan untuk membuka detail.
class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, required this.onTap});

  final CulturalEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      radius: 16,
      onTap: onTap,
      child: Row(
        children: [
          _DateBox(date: event.date),
          const SizedBox(width: 12),
          ArtworkImage(
            event.imageAsset,
            width: 64,
            height: 64,
            radius: 10,
            cacheWidth: 200,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PillBadge(event.category),
                const SizedBox(height: 4),
                Text(
                  event.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.playfair(14, height: 1.3),
                ),
                const SizedBox(height: 2),
                Text(
                  '${event.venue.replaceAll(' TKBJ', '')} · '
                  '${event.startTime} WIB',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}

class _DateBox extends StatelessWidget {
  const _DateBox({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.maroonTint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            Formatters.twoDigits(date.day),
            style: AppText.poppins(
              20,
              weight: FontWeight.w700,
              color: AppColors.maroon,
            ),
          ),
          Text(
            Formatters.monthShort(date.month).toUpperCase(),
            style: AppText.poppins(
              10,
              weight: FontWeight.w600,
              color: AppColors.maroon,
            ),
          ),
        ],
      ),
    );
  }
}
