import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/dummy/dummy_data.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/ticket_item_card.dart';

/// Pesan tiket + keranjang (node 1:609 "mobile-tiket-pertunjukan").
class TicketListScreen extends StatelessWidget {
  const TicketListScreen({super.key});

  void _continue(BuildContext context, AppState state) {
    if (state.isCartEmpty) {
      showAppToast(context, 'Pilih minimal 1 tiket terlebih dahulu.');
      return;
    }
    Navigator.of(context).pushNamed(AppRoutes.checkoutBuyer);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final ticketedEvents = DummyData.events.where((e) => e.isTicketed);
    final lines = state.cartLines;

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Tiket',
          title: 'Pesan Tiket Budaya',
          subtitle:
              'Amankan barisan terdepan untuk menikmati megahnya seni '
              'tradisional legendaris Jatim.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          child: ResponsiveGrid(
            children: [
              for (final event in ticketedEvents)
                TicketItemCard(
                  event: event,
                  quantity: state.quantityOf(event.id),
                  onQuantityChanged: (qty) => state.setQuantity(event.id, qty),
                  onOpenDetail: () => Navigator.of(context)
                      .pushNamed(AppRoutes.eventDetail, arguments: event.id),
                ),
            ],
          ),
        ),
        ContentSection(
          color: AppColors.white,
          border: const Border(top: BorderSide(color: AppColors.border)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Keranjang Tiket', style: AppText.playfair(16)),
              const SizedBox(height: 16),
              if (lines.isEmpty)
                Text(
                  'Keranjang masih kosong. Tekan + untuk menambah tiket '
                  '(maksimal ${AppState.maxTicketsPerEvent} per acara).',
                  style: AppText.poppins(13, color: AppColors.muted),
                )
              else
                for (final line in lines) ...[
                  InfoRow(
                    label:
                        '${line.event.shortTitle.split(':').first} '
                        '(${line.quantity} Tiket)',
                    value: Formatters.rupiah(line.subtotal),
                    fontSize: 13,
                  ),
                  const SizedBox(height: 10),
                ],
              if (lines.isEmpty) const SizedBox(height: 10),
              const ThinDivider(),
              const SizedBox(height: 10),
              InfoRow(
                label: 'Total Biaya',
                value: Formatters.rupiah(state.cartTotal),
                labelStyle: AppText.poppins(14, weight: FontWeight.w700),
                valueStyle: AppText.playfair(18, color: AppColors.maroon),
              ),
              const SizedBox(height: 10),
              AppButton(
                label: 'Lanjut ke Pembayaran',
                onPressed: () => _continue(context, state),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
