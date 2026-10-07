import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/common/app_icon.dart';

/// Baris menu pada halaman Akun Saya.
class AccountMenuTile extends StatelessWidget {
  const AccountMenuTile({
    super.key,
    required this.symbol,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final String symbol;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      onTap: onTap,
      child: Row(
        children: [
          IconBadge(
            child: Text(
              symbol,
              style: AppText.poppins(13, color: AppColors.maroon),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppText.poppins(14, weight: FontWeight.w600),
                ),
                Text(
                  subtitle,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
              ],
            ),
          ),
          Text('›', style: AppText.poppins(18, color: AppColors.muted)),
        ],
      ),
    );
  }
}
