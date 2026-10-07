import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/app_icon.dart';

class FeatureItem {
  const FeatureItem(
    this.symbol,
    this.title,
    this.subtitle,
    this.route, [
    this.arguments,
  ]);

  final String symbol;
  final String title;
  final String subtitle;
  final String route;
  final Object? arguments;
}

/// Kartu "Fitur Utama" di beranda.
class FeatureCard extends StatelessWidget {
  const FeatureCard({super.key, required this.item, required this.onTap});

  final FeatureItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      borderColor: null,
      onTap: onTap,
      child: Row(
        children: [
          IconBadge(
            size: 40,
            child: Text(
              item.symbol,
              style: AppText.poppins(16, color: AppColors.maroon),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: AppText.poppins(14, weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  item.subtitle,
                  style: AppText.poppins(12, color: AppColors.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
