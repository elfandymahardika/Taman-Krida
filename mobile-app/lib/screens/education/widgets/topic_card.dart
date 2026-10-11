import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/culture_topic.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/artwork_image.dart';
import '../../../widgets/common/pill_badge.dart';

/// Kartu materi: gambar 84×84, kategori, judul, ringkasan, durasi baca.
class TopicCard extends StatelessWidget {
  const TopicCard({super.key, required this.topic, required this.onTap});

  final CultureTopic topic;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(13),
      onTap: onTap,
      child: Row(
        children: [
          ArtworkImage(
            topic.imageAsset,
            width: 84,
            height: 84,
            radius: 8,
            cacheWidth: 260,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PillBadge(
                  topic.category,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  topic.title,
                  style: AppText.poppins(14, weight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  topic.summary,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
                const SizedBox(height: 4),
                Text(
                  '${topic.readMinutes} menit baca · Pelajari →',
                  style: AppText.poppins(
                    11,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
