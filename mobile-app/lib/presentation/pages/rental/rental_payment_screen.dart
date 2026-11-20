import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../domain/entities/rental_request.dart';
import '../../../domain/entities/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../checkout/widgets/payment_proof_form.dart';
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
  Future<void> _pay(
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    await context.read<RentalController>().pay(
      widget.code,
      method,
      proof,
      sender,
    );
    if (!mounted) return;
    showAppToast(context, 'Bukti pembayaran sewa terkirim.');
    AppRoutes.openFromHome(
      context,
      AppRoutes.rentalStatus,
      arguments: widget.code,
    );
  }

  @override
  Widget build(BuildContext context) {
    final request = context.watch<RentalController>().findRental(widget.code);
    if (request == null) return RentalNotFound(code: widget.code);
    final canPay =
        request.status == RentalStatus.approved && !request.isVerifyingPayment;

    return TkbjScaffold(
      title: 'Pembayaran Sewa',
      subtitle:
          'Pengajuan Anda disetujui admin. Selesaikan pembayaran dalam '
          '2×24 jam.',
      children: [
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
              RentalSummaryCard(
                title: 'Ringkasan Sewa',
                facility: request.facility,
                date: request.date,
                slot: request.slot,
                amount: request.amount,
                timeLabel: request.timeLabel,
                showRate: true,
              ),
              const SizedBox(height: 20),
              if (request.paymentNote != null &&
                  request.payment == PaymentStatus.waiting) ...[
                NoticeBanner(
                  leading: '!',
                  color: AppColors.error,
                  message: 'Bukti sebelumnya ditolak: ${request.paymentNote}',
                ),
                const SizedBox(height: 16),
              ],
              if (canPay)
                PaymentProofForm(
                  amount: request.amount,
                  submitLabel: 'Kirim Bukti Pembayaran Sewa →',
                  onSubmit: _pay,
                )
              else
                AppButton(
                  label: request.isVerifyingPayment
                      ? 'Sedang Diverifikasi Admin'
                      : 'Sudah Dibayar',
                  onPressed: null,
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
