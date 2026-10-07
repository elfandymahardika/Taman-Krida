import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/checkout_header.dart';
import 'widgets/empty_cart_notice.dart';
import 'widgets/qr_code_box.dart';

/// Checkout langkah 3: konfirmasi pembayaran (node 1:851).
class CheckoutConfirmScreen extends StatelessWidget {
  const CheckoutConfirmScreen({super.key});

  void _complete(BuildContext context) {
    final order = AppStateScope.read(context).placeOrder();
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.checkoutSuccess,
      (route) => route.isFirst,
      arguments: order.bookingCode,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final buyer = state.buyer;
    final method = state.paymentMethod;
    final isVirtualAccount = method == PaymentMethod.virtualAccount;

    return TkbjScaffold(
      children: [
        CheckoutHeader(
          step: 3,
          breadcrumb: 'Tiket / Konfirmasi',
          title: 'Konfirmasi Pembayaran ${method.shortLabel}',
          subtitle: isVirtualAccount
              ? 'Transfer sesuai nominal ke nomor Virtual Account di bawah '
                    'untuk merampungkan tiket pertunjukan Anda.'
              : 'Pindai kode QRIS dinamis di bawah menggunakan aplikasi '
                    'pembayaran favorit Anda untuk merampungkan tiket '
                    'pertunjukan Anda.',
        ),
        ContentSection(
          child: buyer == null || state.isCartEmpty
              ? const EmptyCartNotice()
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      isVirtualAccount
                          ? 'Nomor Virtual Account'
                          : 'Pindai Kode QRIS',
                      style: AppText.playfair(20, color: AppColors.maroon),
                    ),
                    const SizedBox(height: 16),
                    _PaymentPanel(
                      isVirtualAccount: isVirtualAccount,
                      seed: '${buyer.email}${state.cartTotal}',
                      phone: buyer.phone,
                    ),
                    const SizedBox(height: 16),
                    _BookingDetail(
                      buyer: buyer,
                      method: method,
                      total: state.cartTotal,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '*Sistem kami akan memverifikasi pembayaran Anda secara '
                      'real-time setelah proses pemindaian berhasil '
                      'diselesaikan. (Simulasi prototipe — tidak ada dana '
                      'yang ditarik.)',
                      style: AppText.poppins(
                        11,
                        color: AppColors.muted,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 20),
                    AppButton(
                      label: 'Konfirmasi Selesai →',
                      fontSize: 13,
                      onPressed: () => _complete(context),
                    ),
                    const SizedBox(height: 10),
                    AppButton.outline(
                      label: '← Ganti Metode Bayar',
                      fontSize: 13,
                      borderWidth: 1.5,
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _PaymentPanel extends StatelessWidget {
  const _PaymentPanel({
    required this.isVirtualAccount,
    required this.seed,
    required this.phone,
  });

  final bool isVirtualAccount;
  final String seed;
  final String phone;

  /// Nomor VA simulasi: kode bank 8808 + 12 digit dari nomor telepon.
  static String _virtualAccountNumber(String phone) {
    final digits = phone
        .replaceAll(RegExp(r'\D'), '')
        .padRight(12, '0')
        .substring(0, 12);
    final groups = [
      for (var i = 0; i < digits.length; i += 4) digits.substring(i, i + 4),
    ];
    return ['8808', ...groups].join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final vaNumber = _virtualAccountNumber(phone);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        children: [
          if (isVirtualAccount) ...[
            Text(
              'Bank Mandiri · a.n. TKBJ Disbudpar Jatim',
              textAlign: TextAlign.center,
              style: AppText.poppins(12, color: AppColors.muted),
            ),
            const SizedBox(height: 8),
            SelectableText(
              vaNumber,
              textAlign: TextAlign.center,
              style: AppText.poppins(
                20,
                weight: FontWeight.w800,
                color: AppColors.maroon,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                Clipboard.setData(
                  ClipboardData(text: vaNumber.replaceAll(' ', '')),
                );
                showAppToast(context, 'Nomor Virtual Account disalin.');
              },
              child: Text(
                'Salin Nomor',
                style: AppText.poppins(
                  12,
                  weight: FontWeight.w600,
                  color: AppColors.maroon,
                ),
              ),
            ),
          ] else ...[
            QrCodeBox(seed: seed),
            const SizedBox(height: 10),
            Text(
              'QRIS Dinamis TKBJ',
              style: AppText.poppins(
                12,
                weight: FontWeight.w600,
                color: AppColors.muted,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BookingDetail extends StatelessWidget {
  const _BookingDetail({
    required this.buyer,
    required this.method,
    required this.total,
  });

  final BuyerInfo buyer;
  final PaymentMethod method;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Detail Pemesanan', style: AppText.playfair(18)),
          const SizedBox(height: 12),
          InfoRow(label: 'Nama Pemesan', value: buyer.name, fontSize: 13),
          const SizedBox(height: 8),
          InfoRow(label: 'Email', value: buyer.email, fontSize: 13),
          const SizedBox(height: 8),
          InfoRow(
            label: 'Metode Bayar',
            value: '${method.shortLabel} (Admin Rp 0)',
            fontSize: 13,
          ),
          const SizedBox(height: 10),
          const ThinDivider(),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Total Nominal',
            value: Formatters.rupiah(total),
            labelStyle: AppText.poppins(14, weight: FontWeight.w700),
            valueStyle: AppText.playfair(20, color: AppColors.maroon),
          ),
        ],
      ),
    );
  }
}
