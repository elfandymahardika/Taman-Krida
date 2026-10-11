import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../routes/app_routes.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/layout/content_section.dart';
import '../../../widgets/layout/tkbj_scaffold.dart';

/// Halaman jika kode pengajuan sewa tidak ditemukan.
class RentalNotFound extends StatelessWidget {
  const RentalNotFound({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return TkbjScaffold(
      children: [
        ContentSection(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Pengajuan tidak ditemukan',
                style: AppText.playfair(20, color: AppColors.maroon),
              ),
              const SizedBox(height: 8),
              Text(
                'Kode $code tidak ada di riwayat sewa Anda.',
                style: AppText.poppins(13, color: AppColors.muted),
              ),
              const SizedBox(height: 20),
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
