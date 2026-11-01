import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/refresh_on_open.dart';
import '../../widgets/common/section_card.dart';
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

  Future<void> _simulateApproved(BuildContext context) async {
    final navigator = Navigator.of(context);
    await AppStateScope.read(context)
        .simulateAdmin((demo) => demo.approveRental(code));
    navigator.pushNamed(AppRoutes.rentalPayment, arguments: code);
  }

  Future<void> _simulateRejected(BuildContext context) async {
    final navigator = Navigator.of(context);
    await AppStateScope.read(context)
        .simulateAdmin((demo) => demo.rejectRental(code));
    navigator.pushReplacementNamed(AppRoutes.rentalRejected, arguments: code);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final request = state.findRental(code);
    if (request == null) {
      return RefreshOnOpen(
        child: state.accountLoading
            ? const TkbjScaffold(
                children: [ContentSection(child: LoadStatus(loading: true))],
              )
            : RentalNotFound(code: code),
      );
    }
    final navigator = Navigator.of(context);
    final status = request.status;
    final refreshButton = AppButton.outline(
      label: state.accountLoading ? 'Memuat…' : 'Muat Ulang Status',
      onPressed: state.accountLoading ? null : state.refreshAccount,
    );

    return RefreshOnOpen(
      child: TkbjScaffold(
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
                  amount: request.amount,
                  timeLabel: request.timeLabel,
                ),
                const SizedBox(height: 16),
                switch (status) {
                  RentalStatus.pending when state.canSimulateAdmin =>
                    _SimulationPanel(
                      onApproved: () => _simulateApproved(context),
                      onRejected: () => _simulateRejected(context),
                    ),
                  RentalStatus.pending => Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const NoticeBanner(
                        color: AppColors.gold,
                        message:
                            'Admin Sewa TKBJ sedang meninjau pengajuan & '
                            'berkas Anda. Hasilnya dikirim lewat notifikasi.',
                      ),
                      const SizedBox(height: 12),
                      refreshButton,
                    ],
                  ),
                  RentalStatus.approved when request.isVerifyingPayment =>
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const NoticeBanner(
                          color: AppColors.gold,
                          message:
                              'Bukti pembayaran terkirim dan sedang '
                              'diverifikasi Admin Keuangan TKBJ.',
                        ),
                        const SizedBox(height: 12),
                        refreshButton,
                        if (state.canSimulateAdmin) ...[
                          const SizedBox(height: 10),
                          AppButton(
                            label: 'Simulasi: Admin Verifikasi Lunas',
                            onPressed: () => state.simulateAdmin(
                              (demo) => demo.confirmPayment(code),
                            ),
                          ),
                        ],
                      ],
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
      ),
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
