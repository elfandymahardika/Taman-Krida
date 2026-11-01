import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/refresh_on_open.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/e_ticket_card.dart';
import 'widgets/order_summary_card.dart';
import 'widgets/payment_proof_form.dart';

/// Checkout langkah 4 (node 1:928): status pesanan sesuai data server.
/// Menunggu pembayaran → form unggah bukti; sedang diverifikasi → info;
/// lunas → "Pembayaran Berhasil!" + e-tiket.
class CheckoutSuccessScreen extends StatelessWidget {
  const CheckoutSuccessScreen({super.key, required this.bookingCode});

  final String bookingCode;

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final order = state.findOrder(bookingCode);
    final navigator = Navigator.of(context);

    return RefreshOnOpen(
      child: TkbjScaffold(
        children: [
          ContentSection(
            padding: const EdgeInsets.all(24),
            child: order == null
                ? LoadStatus(
                    loading: state.accountLoading,
                    error: state.accountLoading
                        ? null
                        : 'Pesanan $bookingCode tidak ditemukan.',
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _StatusHeader(order: order),
                      const SizedBox(height: 32),
                      ...switch (order.status) {
                        PaymentStatus.paid => [ETicketCard(order: order)],
                        PaymentStatus.verifying => [
                          OrderSummaryCard(
                            lines: order.lines,
                            total: order.total,
                          ),
                          const SizedBox(height: 16),
                          AppButton.outline(
                            label: state.accountLoading
                                ? 'Memuat…'
                                : 'Muat Ulang Status',
                            onPressed: state.accountLoading
                                ? null
                                : state.refreshAccount,
                          ),
                          if (state.canSimulateAdmin) ...[
                            const SizedBox(height: 10),
                            AppButton(
                              label: 'Simulasi: Admin Verifikasi Lunas',
                              onPressed: () => state.simulateAdmin(
                                (demo) => demo.confirmPayment(bookingCode),
                              ),
                            ),
                          ],
                        ],
                        PaymentStatus.waiting => [
                          OrderSummaryCard(
                            lines: order.lines,
                            total: order.total,
                          ),
                          const SizedBox(height: 16),
                          if (order.adminNote != null) ...[
                            NoticeBanner(
                              leading: '!',
                              color: AppColors.error,
                              message:
                                  'Bukti sebelumnya ditolak: '
                                  '${order.adminNote}',
                            ),
                            const SizedBox(height: 16),
                          ],
                          PaymentProofForm(
                            amount: order.total,
                            initialMethod: order.method ?? state.paymentMethod,
                            onSubmit: (method, proof, sender) async {
                              await state.payBooking(
                                bookingCode,
                                method,
                                proof,
                                sender,
                              );
                              if (context.mounted) {
                                showAppToast(
                                  context,
                                  'Bukti pembayaran terkirim.',
                                );
                              }
                            },
                          ),
                        ],
                      },
                      const SizedBox(height: 32),
                      AppButton(
                        label: 'Kembali ke Beranda',
                        fontSize: 13,
                        onPressed: () => AppRoutes.goHome(context),
                      ),
                      const SizedBox(height: 16),
                      AppButton.outline(
                        label: 'Lihat Tiket Saya',
                        onPressed: () =>
                            navigator.pushNamed(AppRoutes.myTickets),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.order});

  final TicketOrder order;

  @override
  Widget build(BuildContext context) {
    final payBefore = order.payBefore;
    final (symbol, color, title, message) = switch (order.status) {
      PaymentStatus.paid => (
        '✓',
        AppColors.success,
        'Pembayaran Berhasil!',
        'Pembayaran sudah diverifikasi. E-Tiket resmi Anda aktif — tunjukkan '
            'kode booking di loket.',
      ),
      PaymentStatus.verifying => (
        '⏳',
        AppColors.gold,
        'Bukti Pembayaran Terkirim',
        'Admin Keuangan TKBJ sedang memverifikasi pembayaran pesanan '
            '${order.bookingCode}. E-Tiket terbit setelah dinyatakan lunas.',
      ),
      PaymentStatus.waiting => (
        '⏰',
        AppColors.maroon,
        'Menunggu Pembayaran',
        'Pesanan ${order.bookingCode} sudah dibuat. Unggah bukti pembayaran'
            '${payBefore == null ? '' : ' sebelum ${Formatters.dateTime(payBefore)}'}'
            ' agar kursi tidak dilepas.',
      ),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.15),
                  offset: const Offset(0, 8),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Text(
              symbol,
              style: AppText.poppins(
                28,
                weight: FontWeight.w700,
                color: AppColors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
        Text(title, textAlign: TextAlign.center, style: AppText.playfair(28)),
        const SizedBox(height: 8),
        Text(
          message,
          textAlign: TextAlign.center,
          style: AppText.poppins(14, color: AppColors.muted),
        ),
      ],
    );
  }
}
