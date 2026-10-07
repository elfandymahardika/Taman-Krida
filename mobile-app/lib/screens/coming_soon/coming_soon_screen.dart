import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Halaman sementara untuk fitur yang belum masuk lingkup UTS.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / $title',
          title: title,
          subtitle: 'Fitur ini sedang dalam tahap pengembangan.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                '❖',
                textAlign: TextAlign.center,
                style: AppText.poppins(40, color: AppColors.gold),
              ),
              const SizedBox(height: 12),
              Text(
                'Segera Hadir',
                textAlign: TextAlign.center,
                style: AppText.playfair(24, color: AppColors.maroon),
              ),
              const SizedBox(height: 8),
              Text(
                'Halaman $title sudah dirancang di Figma dan akan '
                'diimplementasikan pada tahap pengembangan berikutnya.',
                textAlign: TextAlign.center,
                style: AppText.poppins(13, color: AppColors.muted),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Kembali ke Beranda',
                onPressed: () => AppRoutes.goHome(context),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
