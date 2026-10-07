import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/cultural_event.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/pill_badge.dart';

/// Kartu acara pada kalender: tanggal, foto, kategori, judul, lokasi.
class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, required this.onTap});

  final CulturalEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _DateBox(date: event.date),
              const SizedBox(width: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  event.imageAsset,
                  width: 64,
                  height: 61,
                  fit: BoxFit.cover,
                  cacheWidth: 200,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    PillBadge(event.category),
                    const SizedBox(height: 2),
                    Text(
                      event.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.playfair(14),
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
            ],
          ),
          const SizedBox(height: 12),
          AppButton.outline(
            label: 'Lihat Detail',
            fontSize: 12,
            verticalPadding: 8,
            radius: 6,
            onPressed: onTap,
          ),
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
