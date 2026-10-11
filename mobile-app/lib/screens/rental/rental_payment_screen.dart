import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/models/rental_request.dart';
import '../../data/models/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../checkout/widgets/payment_option_tile.dart';
import 'widgets/rental_not_found.dart';
import 'widgets/rental_summary_card.dart';

/// Pembayaran sewa setelah disetujui (node 157:1690).
class RentalPaymentScreen extends StatefulWidget {
  const RentalPaymentScreen({super.key, required this.code});

  final String code;

  @override
  State<RentalPaymentScreen> createState() => _RentalPaymentScreenState();
}

class _RentalPaymentScreenState extends State<RentalPaymentScreen> {
  PaymentMethod _method = PaymentMethod.qris;

  void _pay() {
    AppStateScope.read(context).payRental(widget.code, _method);
    AppRoutes.openFromHome(
      context,
      AppRoutes.rentalReceipt,
      arguments: widget.code,
    );
  }

  @override
  Widget build(BuildContext context) {
    final request = AppStateScope.of(context).findRental(widget.code);
    if (request == null) return RentalNotFound(code: widget.code);
    final canPay = request.status == RentalStatus.approved;

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Sewa Gedung / Pembayaran',
          title: 'Pembayaran Sewa',
          subtitle:
              'Pengajuan Anda disetujui admin. Selesaikan pembayaran dalam '
              '2×24 jam.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          color: const Color(0x1A3A9D4F),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Text(
                '✓',
                style: AppText.poppins(
                  14,
                  weight: FontWeight.w700,
                  color: AppColors.success,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Disetujui Admin · ${request.code} · ${request.facility.name}',
                  style: AppText.poppins(12, weight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        ContentSection(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Pilih Metode Pembayaran Resmi',
                style: AppText.playfair(20, color: AppColors.maroon),
              ),
              const SizedBox(height: 20),
              for (final method in PaymentMethod.values) ...[
                PaymentOptionTile(
                  method: method,
                  selected: _method == method,
                  onTap: () => setState(() => _method = method),
                ),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 8),
              RentalSummaryCard(
                title: 'Ringkasan Sewa',
                facility: request.facility,
                date: request.date,
                slot: request.slot,
                showRate: true,
              ),
              const SizedBox(height: 20),
              AppButton(
                label: canPay ? 'Bayar Sekarang →' : 'Sudah Dibayar',
                onPressed: canPay ? _pay : null,
              ),
              const SizedBox(height: 10),
              AppButton.outline(
                label: '← Lihat Status Pengajuan',
                onPressed: () => Navigator.of(context).pushReplacementNamed(
                  AppRoutes.rentalStatus,
                  arguments: widget.code,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
