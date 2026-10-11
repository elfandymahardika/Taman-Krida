import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../routes/app_routes.dart';
import '../../../widgets/common/app_button.dart';

/// Ditampilkan jika langkah sewa dibuka tanpa melewati langkah sebelumnya.
class MissingStepNotice extends StatelessWidget {
  const MissingStepNotice({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Data pengajuan belum lengkap',
          style: AppText.playfair(20, color: AppColors.maroon),
        ),
        const SizedBox(height: 8),
        Text(message, style: AppText.poppins(13, color: AppColors.muted)),
        const SizedBox(height: 20),
        AppButton(
          label: 'Mulai dari Pilih Venue',
          onPressed: () => AppRoutes.openFromHome(context, AppRoutes.rental),
        ),
      ],
    );
  }
}
