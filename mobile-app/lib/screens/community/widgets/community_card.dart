import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/community.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/artwork_image.dart';
import 'whatsapp_button.dart';

/// Kartu komunitas: foto, nama, spesialisasi, nomor, dan tombol WA.
class CommunityCard extends StatelessWidget {
  const CommunityCard({
    super.key,
    required this.community,
    required this.onTap,
    required this.onContact,
  });

  final Community community;
  final VoidCallback onTap;
  final VoidCallback onContact;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ArtworkImage(
            community.imageAsset,
            height: 190,
            radius: 8,
            cacheWidth: 900,
          ),
          const SizedBox(height: 12),
          Text(community.name, style: AppText.playfair(16)),
          const SizedBox(height: 4),
          Text(
            'Spesialisasi: ${community.specialization}',
            style: AppText.poppins(12, color: AppColors.muted),
          ),
          const SizedBox(height: 4),
          Text(
            'No. Telp: ${community.phone}',
            style: AppText.poppins(12, color: AppColors.muted),
          ),
          const SizedBox(height: 12),
          WhatsAppButton(label: 'Hubungi Sanggar via WA', onPressed: onContact),
        ],
      ),
    );
  }
}
