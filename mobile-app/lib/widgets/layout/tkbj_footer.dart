import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../common/brand_logo.dart';
import 'content_section.dart';

/// Footer maroon tua di bagian bawah setiap layar.
class TkbjFooter extends StatelessWidget {
  const TkbjFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return ContentSection(
      color: AppColors.maroonDark,
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottomInset),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => AppRoutes.goHome(context),
                child: const BrandLogo(onDark: true),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Disbudpar Provinsi Jawa Timur',
                  textAlign: TextAlign.right,
                  style: AppText.poppins(11, color: AppColors.blush),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(height: 1, color: AppColors.footerDivider),
          const SizedBox(height: 20),
          Text(
            '© 2026 Taman Krida Budaya Jawa Timur. All rights reserved. '
            'Jl. Soekarno-Hatta No. 7, Kota Malang.',
            style: AppText.poppins(12, color: AppColors.footerText),
          ),
        ],
      ),
    );
  }
}
