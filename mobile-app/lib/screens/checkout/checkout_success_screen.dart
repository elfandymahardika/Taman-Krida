import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/e_ticket_card.dart';

/// Checkout langkah 4: pembayaran berhasil + e-tiket (node 1:928).
class CheckoutSuccessScreen extends StatelessWidget {
  const CheckoutSuccessScreen({super.key, required this.bookingCode});

  final String bookingCode;

  @override
  Widget build(BuildContext context) {
    final order = AppStateScope.of(context).findOrder(bookingCode);
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        ContentSection(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x263A9D4F),
                        offset: Offset(0, 8),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Text(
                    '✓',
                    style: AppText.poppins(
                      28,
                      weight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Pembayaran Berhasil!',
                textAlign: TextAlign.center,
                style: AppText.playfair(28),
              ),
              const SizedBox(height: 8),
              Text(
                'Transaksi Anda sukses. E-Tiket resmi telah dikirimkan ke '
                'alamat email Anda.',
                textAlign: TextAlign.center,
                style: AppText.poppins(14, color: AppColors.muted),
              ),
              const SizedBox(height: 32),
              if (order != null) ...[
                ETicketCard(order: order),
                const SizedBox(height: 32),
              ],
              AppButton(
                label: 'Kembali ke Beranda',
                fontSize: 13,
                onPressed: () => AppRoutes.goHome(context),
              ),
              const SizedBox(height: 32),
              AppButton.outline(
                label: 'Lihat Tiket Saya',
                onPressed: () => navigator.pushNamed(AppRoutes.myTickets),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
