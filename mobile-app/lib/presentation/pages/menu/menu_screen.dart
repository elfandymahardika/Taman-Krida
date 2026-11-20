import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_icon.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'service_entries.dart';

/// Tab "Jelajah": semua layanan TKBJ + ajakan masuk bagi tamu.
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AuthController>().isLoggedIn;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      title: 'Jelajah',
      subtitle: 'Semua informasi dan layanan TKBJ dalam satu tempat.',
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'LAYANAN',
                style: AppText.poppins(
                  11,
                  weight: FontWeight.w600,
                  color: AppColors.maroon,
                ),
              ),
              for (final service in [...appServices, assistantService]) ...[
                const SizedBox(height: 10),
                _MenuTile(
                  service: service,
                  onTap: () => AppRoutes.open(context, service.route),
                ),
              ],
            ],
          ),
        ),
        if (!isLoggedIn)
          ContentSection(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
            child: AppCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Punya akun TKBJ?', style: AppText.playfair(16)),
                  const SizedBox(height: 4),
                  Text(
                    'Masuk atau daftar untuk memesan tiket, mengajukan sewa '
                    'gedung, dan mendaftarkan komunitas.',
                    style: AppText.poppins(12, color: AppColors.muted),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: 'Masuk',
                          fontSize: 13,
                          radius: 10,
                          onPressed: () => navigator.pushNamed(AppRoutes.login),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: AppButton.outline(
                          label: 'Daftar Akun',
                          fontSize: 13,
                          radius: 10,
                          onPressed: () =>
                              navigator.pushNamed(AppRoutes.register),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.service, required this.onTap});

  final ServiceEntry service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      radius: 16,
      child: Row(
        children: [
          IconBadge(
            size: 42,
            child: Icon(service.icon, size: 22, color: AppColors.maroon),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.title,
                  style: AppText.poppins(14, weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  service.subtitle,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}
