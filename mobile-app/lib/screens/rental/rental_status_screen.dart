import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/process_timeline.dart';
import 'widgets/rental_not_found.dart';
import 'widgets/rental_stepper.dart';
import 'widgets/rental_summary_card.dart';

/// Sewa langkah 5: status verifikasi (node 157:1521).
class RentalStatusScreen extends StatelessWidget {
  const RentalStatusScreen({super.key, required this.code});

  final String code;

  void _simulateApproved(BuildContext context) {
    AppStateScope.read(context).approveRental(code);
    Navigator.of(context).pushNamed(AppRoutes.rentalPayment, arguments: code);
  }

  void _simulateRejected(BuildContext context) {
    AppStateScope.read(context).rejectRental(code);
    Navigator.of(context)
        .pushReplacementNamed(AppRoutes.rentalRejected, arguments: code);
  }

  @override
  Widget build(BuildContext context) {
    final request = AppStateScope.of(context).findRental(code);
    if (request == null) return RentalNotFound(code: code);
    final navigator = Navigator.of(context);
    final status = request.status;

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Sewa Gedung / Status',
          title: 'Status Pengajuan',
          subtitle: switch (status) {
            RentalStatus.pending =>
              'Pengajuan Anda sedang ditinjau oleh admin TKBJ.',
            RentalStatus.approved =>
              'Pengajuan disetujui. Selesaikan pembayaran sewa.',
            RentalStatus.paid => 'Reservasi venue Anda sudah terkonfirmasi.',
            RentalStatus.rejected => 'Pengajuan ditolak admin TKBJ.',
          },
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        const RentalStepper(current: 5),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _StatusCard(request: request),
              const SizedBox(height: 16),
              ProcessTimeline(request: request),
              const SizedBox(height: 16),
              RentalSummaryCard(
                facility: request.facility,
                date: request.date,
                slot: request.slot,
              ),
              const SizedBox(height: 16),
              switch (status) {
                RentalStatus.pending => _SimulationPanel(
                  onApproved: () => _simulateApproved(context),
                  onRejected: () => _simulateRejected(context),
                ),
                RentalStatus.approved => AppButton(
                  label: 'Lanjut ke Pembayaran →',
                  onPressed: () => navigator.pushNamed(
                    AppRoutes.rentalPayment,
                    arguments: code,
                  ),
                ),
                RentalStatus.paid => AppButton(
                  label: 'Lihat Bukti Reservasi',
                  onPressed: () => navigator.pushNamed(
                    AppRoutes.rentalReceipt,
                    arguments: code,
                  ),
                ),
                RentalStatus.rejected => AppButton(
                  label: 'Lihat Catatan Admin',
                  onPressed: () => navigator.pushReplacementNamed(
                    AppRoutes.rentalRejected,
                    arguments: code,
                  ),
                ),
              },
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: () => AppRoutes.goHome(context),
                  child: Text(
                    'Kembali ke Beranda',
                    style: AppText.poppins(
                      13,
                      weight: FontWeight.w600,
                      color: AppColors.maroon,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.request});

  final RentalRequest request;

  @override
  Widget build(BuildContext context) {
    final (symbol, title, color) = switch (request.status) {
      RentalStatus.pending => (
        '⏳',
        'Menunggu Verifikasi Admin',
        AppColors.gold,
      ),
      RentalStatus.approved => (
        '✅',
        'Disetujui · Menunggu Pembayaran',
        AppColors.success,
      ),
      RentalStatus.paid => ('✅', 'Reservasi Terkonfirmasi', AppColors.success),
      RentalStatus.rejected => ('❌', 'Pengajuan Ditolak', AppColors.error),
    };
    return Container(
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        children: [
          Text(symbol, style: AppText.poppins(24)),
          const SizedBox(height: 8),
          Text(title, textAlign: TextAlign.center, style: AppText.playfair(18)),
          const SizedBox(height: 8),
          Text(
            request.status == RentalStatus.pending
                ? 'Kode pengajuan ${request.code} · estimasi 1×24 jam kerja'
                : 'Kode pengajuan ${request.code}',
            textAlign: TextAlign.center,
            style: AppText.poppins(12, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}

/// Pada prototipe tidak ada admin sungguhan, jadi hasil verifikasi dipilih
/// manual untuk demo (sesuai frame "Simulasi" di Figma).
class _SimulationPanel extends StatelessWidget {
  const _SimulationPanel({required this.onApproved, required this.onRejected});

  final VoidCallback onApproved;
  final VoidCallback onRejected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.goldTint,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'Simulasi prototype — pilih hasil verifikasi admin:',
            style: AppText.poppins(11, weight: FontWeight.w500),
          ),
        ),
        const SizedBox(height: 10),
        AppButton(label: 'Lihat Hasil: Disetujui', onPressed: onApproved),
        const SizedBox(height: 10),
        AppButton.outline(label: 'Lihat Hasil: Ditolak', onPressed: onRejected),
      ],
    );
  }
}
