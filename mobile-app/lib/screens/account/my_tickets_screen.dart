import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/ticket_order.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/common/refresh_on_open.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../checkout/widgets/e_ticket_card.dart';
import '../../widgets/interactive/segmented_tabs.dart';

/// Tiket saya: hasil input checkout (node 1:2928 "mobile-tiket-saya").
class MyTicketsScreen extends StatefulWidget {
  const MyTicketsScreen({super.key});

  @override
  State<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  int _tab = 0;

  void _showETicket(TicketOrder order) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ETicketCard(order: order),
          const SizedBox(height: 16),
          AppButton.outline(
            label: 'Tutup',
            onPressed: () => Navigator.of(sheetContext).pop(),
          ),
        ],
      ),
    );
  }

  void _open(TicketOrder order) {
    if (order.isPaid) {
      _showETicket(order);
    } else {
      Navigator.of(context)
          .pushNamed(AppRoutes.checkoutSuccess, arguments: order.bookingCode);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final all = state.ticketLines;
    final active = [
      for (final t in all)
        if (!state.isDatePast(t.line.event.date)) t,
    ];
    final history = [
      for (final t in all)
        if (state.isDatePast(t.line.event.date)) t,
    ];
    final tickets = _tab == 0 ? active : history;
    final navigator = Navigator.of(context);

    return RefreshOnOpen(
      child: TkbjScaffold(
        children: [
          PageHeader(
            breadcrumb: 'Akun Saya / Tiket Saya',
            title: 'Tiket Saya',
            subtitle: 'E-tiket aktif dan riwayat pertunjukan Anda.',
            onBreadcrumbTap: () => navigator.pop(),
          ),
          ContentSection(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SegmentedTabs(
                  labels: ['Aktif (${active.length})', 'Riwayat'],
                  selected: _tab,
                  onChanged: (i) => setState(() => _tab = i),
                ),
                const SizedBox(height: 12),
                if (tickets.isNotEmpty)
                  ResponsiveGrid(
                    children: [
                      for (final ticket in tickets)
                        _TicketCard(
                          order: ticket.order,
                          line: ticket.line,
                          onShow: () => _open(ticket.order),
                        ),
                    ],
                  )
                else if (state.accountLoading)
                  const LoadStatus(loading: true)
                else
                  _EmptyTickets(
                    message: _tab == 0
                        ? 'Belum ada tiket aktif. Pesan tiket pertunjukan '
                              'untuk melihatnya di sini.'
                        : 'Belum ada riwayat pertunjukan.',
                  ),
                const SizedBox(height: 12),
                AppButton(
                  label: '+ Pesan Tiket Lain',
                  onPressed: () => navigator.pushNamed(AppRoutes.tickets),
                ),
                const SizedBox(height: 10),
                AppButton.outline(
                  label: '← Kembali ke Akun',
                  onPressed: () => navigator.pushNamedAndRemoveUntil(
                    AppRoutes.account,
                    (route) => route.isFirst,
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

class _TicketCard extends StatelessWidget {
  const _TicketCard({
    required this.order,
    required this.line,
    required this.onShow,
  });

  final TicketOrder order;
  final CartLine line;
  final VoidCallback onShow;

  @override
  Widget build(BuildContext context) {
    final event = line.event;
    return AppCard(
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: ArtworkImage(
                  event.imageAsset,
                  width: 72,
                  height: 72,
                  cacheWidth: 170,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.shortTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.playfair(14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${Formatters.shortDate(event.date)} · '
                      '${event.startTime} · ${line.quantity} tiket',
                      style: AppText.poppins(11, color: AppColors.muted),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        PillBadge(
                          order.status.label.toUpperCase(),
                          color: order.isPaid
                              ? AppColors.success
                              : AppColors.gold,
                          background: order.isPaid
                              ? const Color(0x263A9D4F)
                              : AppColors.goldTint,
                          weight: FontWeight.w700,
                          fontSize: 10,
                        ),
                        Text(
                          order.bookingCode,
                          style: AppText.poppins(
                            11,
                            weight: FontWeight.w600,
                            color: AppColors.maroon,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppButton.outline(
            label: switch (order.status) {
              PaymentStatus.paid => 'Lihat E-Tiket',
              PaymentStatus.verifying => 'Lihat Status Pembayaran',
              PaymentStatus.waiting => 'Unggah Bukti Pembayaran',
            },
            fontSize: 13,
            verticalPadding: 12,
            onPressed: onShow,
          ),
        ],
      ),
    );
  }
}

class _EmptyTickets extends StatelessWidget {
  const _EmptyTickets({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: AppText.poppins(12, color: AppColors.muted),
      ),
    );
  }
}
