import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../routes/app_routes.dart';
import '../../../widgets/common/app_button.dart';

/// Ditampilkan jika langkah checkout dibuka tanpa isi keranjang.
class EmptyCartNotice extends StatelessWidget {
  const EmptyCartNotice({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Keranjang tiket kosong',
          style: AppText.playfair(20, color: AppColors.maroon),
        ),
        const SizedBox(height: 8),
        Text(
          'Pilih tiket pertunjukan terlebih dahulu sebelum melanjutkan '
          'pembayaran.',
          style: AppText.poppins(13, color: AppColors.muted),
        ),
        const SizedBox(height: 20),
        AppButton(
          label: 'Pilih Tiket',
          onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
            AppRoutes.tickets,
            (route) => route.isFirst,
          ),
        ),
      ],
    );
  }
}
