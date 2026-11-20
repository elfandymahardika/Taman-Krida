import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../domain/entities/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../../widgets/interactive/step_tracker.dart';
import 'widgets/empty_cart_notice.dart';
import 'widgets/order_summary_card.dart';
import 'widgets/payment_option_tile.dart';

/// Checkout langkah 2: pilih metode pembayaran (node 1:772).
class CheckoutPaymentScreen extends StatelessWidget {
  const CheckoutPaymentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ticketController = context.watch<TicketController>();
    final navigator = Navigator.of(context);
    final ready =
        !ticketController.isCartEmpty && ticketController.buyer != null;

    return TkbjScaffold(
      title: 'Metode Pembayaran',
      subtitle:
          'Pilih kanal pembayaran instan atau transfer bank resmi untuk '
          'menyelesaikan transaksi tiket TKBJ Anda.',
      children: [
        const StepTracker(current: 2),
        ContentSection(
          child: !ready
              ? const EmptyCartNotice()
              : Column(
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
                        selected: ticketController.paymentMethod == method,
                        onTap: () =>
                            ticketController.selectPaymentMethod(method),
                      ),
                      const SizedBox(height: 12),
                    ],
                    const SizedBox(height: 8),
                    OrderSummaryCard(
                      lines: ticketController.cartLines,
                      total: ticketController.cartTotal,
                    ),
                    const SizedBox(height: 20),
                    AppButton(
                      label: 'Lanjutkan ke Konfirmasi →',
                      fontSize: 13,
                      onPressed: () =>
                          navigator.pushNamed(AppRoutes.checkoutConfirm),
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}
