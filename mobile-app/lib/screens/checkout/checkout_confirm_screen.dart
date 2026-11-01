import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/api/api_client.dart';
import '../../data/models/rental_request.dart';
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
import 'widgets/payment_proof_form.dart';
import 'widgets/qr_code_box.dart';

/// Checkout langkah 3: konfirmasi pembayaran (node 1:851). Pesanan dibuat di
/// server (masuk menu Transaksi dashboard), lalu bukti bayar diunggah untuk
/// diverifikasi Admin Keuangan.
class CheckoutConfirmScreen extends StatefulWidget {
  const CheckoutConfirmScreen({super.key});

  @override
  State<CheckoutConfirmScreen> createState() => _CheckoutConfirmScreenState();
}

class _CheckoutConfirmScreenState extends State<CheckoutConfirmScreen> {
  /// Pesanan yang sudah dibuat; dipakai ulang bila unggah bukti gagal.
  TicketOrder? _order;
  bool _busy = false;

  Future<TicketOrder> _ensureOrder() async =>
      _order ??= await AppStateScope.read(context).placeOrder();

  void _openStatus(String code) {
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.checkoutSuccess,
      (route) => route.isFirst,
      arguments: code,
    );
  }

  Future<void> _payNow(
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final state = AppStateScope.read(context);
    final order = await _ensureOrder();
    await state.payBooking(order.bookingCode, method, proof, sender);
    if (mounted) _openStatus(order.bookingCode);
  }

  Future<void> _payLater() async {
    setState(() => _busy = true);
    try {
      final order = await _ensureOrder();
      if (mounted) _openStatus(order.bookingCode);
    } on ApiException catch (e) {
      if (mounted) showAppToast(context, e.displayMessage);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final buyer = state.buyer;
    final method = state.paymentMethod;
    final isVirtualAccount = method == PaymentMethod.virtualAccount;
    final total = _order?.total ?? state.cartTotal;
    final ready = _order != null || (buyer != null && !state.isCartEmpty);

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
          child: !ready
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
                      seed: '${buyer?.email}$total',
                      phone: buyer?.phone ?? '',
                    ),
                    const SizedBox(height: 16),
                    if (buyer != null)
                      _BookingDetail(
                        buyer: buyer,
                        method: method,
                        total: total,
                      ),
                    const SizedBox(height: 12),
                    Text(
                      '*Kode QR & nomor VA di atas adalah contoh. Setelah '
                      'membayar, unggah bukti pembayaran agar pesanan '
                      'diverifikasi Admin Keuangan TKBJ.',
                      style: AppText.poppins(
                        11,
                        color: AppColors.muted,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 20),
                    PaymentProofForm(
                      amount: total,
                      initialMethod: method,
                      showMethods: false,
                      submitLabel: 'Pesan & Kirim Bukti Pembayaran →',
                      onSubmit: _payNow,
                    ),
                    const SizedBox(height: 10),
                    AppButton.outline(
                      label: _busy
                          ? 'Memproses…'
                          : 'Pesan Sekarang, Bayar Nanti',
                      fontSize: 13,
                      borderWidth: 1.5,
                      onPressed: _busy ? null : _payLater,
                    ),
                    const SizedBox(height: 10),
                    if (_order == null)
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
