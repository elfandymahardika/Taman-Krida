import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/receipt_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/rental_not_found.dart';

/// Bukti reservasi venue (node 157:1751 "mobile-sewa-bukti-reservasi").
class RentalReceiptScreen extends StatelessWidget {
  const RentalReceiptScreen({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    final request = AppStateScope.of(context).findRental(code);
    if (request == null) return RentalNotFound(code: code);
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
                'Reservasi Terkonfirmasi!',
                textAlign: TextAlign.center,
                style: AppText.playfair(28),
              ),
              const SizedBox(height: 8),
              Text(
                'Pembayaran sewa diterima. Bukti reservasi resmi telah dikirim '
                'ke email & WhatsApp Anda.',
                textAlign: TextAlign.center,
                style: AppText.poppins(14, color: AppColors.muted),
              ),
              const SizedBox(height: 32),
              ReceiptCard(
                title: 'Bukti Reservasi Venue',
                rows: [
                  ReceiptRow('Pemesan', request.applicantName),
                  ReceiptRow('Tanggal', Formatters.longDate(request.date)),
                  ReceiptRow(
                    'Venue & Waktu',
                    '${request.facility.name} · ${request.durationHours} jam '
                        '(${request.slot.shortLabel} WIB)',
                    stacked: true,
                  ),
                ],
                codeLabel: 'Kode Reservasi Anda',
                code: request.code,
              ),
              const SizedBox(height: 32),
              AppButton(
                label: 'Kembali ke Beranda',
                fontSize: 13,
                onPressed: () => AppRoutes.goHome(context),
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: 'Lihat Riwayat Sewa',
                onPressed: () => navigator.pushNamed(AppRoutes.rentalHistory),
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: 'Unduh Bukti (PDF)',
                onPressed: () => showAppToast(
                  context,
                  'Bukti reservasi tersimpan (PDF) — simulasi prototype.',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
