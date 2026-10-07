import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'content_section.dart';

/// Header maroon berisi breadcrumb, judul, dan deskripsi singkat halaman.
class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.breadcrumb,
    required this.title,
    required this.subtitle,
    this.onBreadcrumbTap,
    this.gradient = AppGradients.pageHeader,
  });

  final String breadcrumb;
  final String title;
  final String subtitle;
  final VoidCallback? onBreadcrumbTap;
  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    return ContentSection(
      gradient: gradient,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: onBreadcrumbTap,
            child: Text(
              breadcrumb,
              style: AppText.poppins(
                11,
                weight: FontWeight.w500,
                color: AppColors.gold,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(title, style: AppText.playfair(24, color: AppColors.white)),
          const SizedBox(height: 8),
          Text(subtitle, style: AppText.poppins(13, color: AppColors.blush)),
        ],
      ),
    );
  }
}
