import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/ticket_item_card.dart';

/// Pesan tiket + keranjang (node 1:609 "mobile-tiket-pertunjukan").
class TicketListScreen extends StatelessWidget {
  const TicketListScreen({super.key});

  void _continue(BuildContext context, TicketController ticketController) {
    if (ticketController.isCartEmpty) {
      showAppToast(context, 'Pilih minimal 1 tiket terlebih dahulu.');
      return;
    }
    Navigator.of(context).pushNamed(AppRoutes.checkoutBuyer);
  }

  @override
  Widget build(BuildContext context) {
    final catalogController = context.watch<CatalogController>();
    final ticketController = context.watch<TicketController>();
    final ticketedEvents = catalogController.ticketedEvents;
    final lines = ticketController.cartLines;

    return TkbjScaffold(
      bottomBar: Row(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Total Biaya',
                style: AppText.poppins(11, color: AppColors.muted),
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Text(
                  Formatters.rupiah(ticketController.cartTotal),
                  key: ValueKey(ticketController.cartTotal),
                  style: AppText.playfair(18, color: AppColors.maroon),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: AppButton(
              label: 'Lanjut ke Pembayaran',
              radius: 12,
              onPressed: () => _continue(context, ticketController),
            ),
          ),
        ],
      ),
      title: 'Pesan Tiket Budaya',
      subtitle:
          'Amankan barisan terdepan untuk menikmati megahnya seni '
          'tradisional legendaris Jatim.',
      children: [
        ContentSection(
          child: catalogController.loadState != LoadState.ready
              ? LoadStatus.catalog(catalogController)
              : ticketedEvents.isEmpty
              ? const LoadStatus(
                  loading: false,
                  error:
                      'Belum ada pertunjukan bertiket yang bisa dipesan. '
                      'Pantau Kalender Acara untuk agenda berikutnya.',
                )
              : ResponsiveGrid(
                  children: [
                    for (final event in ticketedEvents)
                      TicketItemCard(
                        event: event,
                        quantity: ticketController.quantityOf(event.id),
                        onQuantityChanged: (qty) =>
                            ticketController.setQuantity(event.id, qty),
                        onOpenDetail: () => Navigator.of(
                          context,
                        ).pushNamed(AppRoutes.eventDetail, arguments: event.id),
                      ),
                  ],
                ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
          child: AppCard(
            radius: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.shopping_bag_outlined,
                      size: 20,
                      color: AppColors.maroon,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Keranjang Tiket',
                        style: AppText.playfair(16),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                if (lines.isEmpty)
                  Text(
                    'Keranjang masih kosong. Tekan + untuk menambah tiket '
                    '(maksimal ${TicketController.maxTicketsPerEvent} per acara).',
                    style: AppText.poppins(13, color: AppColors.muted),
                  )
                else
                  for (final (i, line) in lines.indexed) ...[
                    if (i > 0) const SizedBox(height: 10),
                    InfoRow(
                      label:
                          '${line.event.shortTitle.split(':').first} '
                          '(${line.quantity} Tiket)',
                      value: Formatters.rupiah(line.subtotal),
                      fontSize: 13,
                    ),
                  ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
