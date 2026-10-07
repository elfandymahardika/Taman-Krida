import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/ticket_order.dart';
import '../../../widgets/common/dashed_border_box.dart';
import '../../../widgets/common/info_row.dart';
import '../../../widgets/common/pill_badge.dart';

/// Kartu "E-Tiket Resmi TKBJ" berisi data pesanan dan kode booking.
class ETicketCard extends StatelessWidget {
  const ETicketCard({super.key, required this.order});

  final TicketOrder order;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: AppColors.cardShadow,
            offset: Offset(0, 8),
            blurRadius: 12,
          ),
        ],
      ),
      child: DashedBorderBox(
        color: AppColors.border,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'E-Tiket Resmi TKBJ',
                    style: AppText.playfair(18, color: AppColors.maroon),
                  ),
                ),
                const PillBadge(
                  'LUNAS / PAID',
                  fontSize: 10,
                  weight: FontWeight.w700,
                  radius: 6,
                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const ThinDivider(),
            const SizedBox(height: 16),
            InfoRow(label: 'Pemesan', value: order.buyer.name, fontSize: 13),
            const SizedBox(height: 10),
            InfoRow(
              label: 'Tanggal',
              value: Formatters.longDate(order.paidAt),
              fontSize: 13,
            ),
            const SizedBox(height: 10),
            Text(
              'Item Pertunjukan',
              style: AppText.poppins(13, color: AppColors.muted),
            ),
            const SizedBox(height: 4),
            Text(
              order.itemsSummary,
              style: AppText.poppins(12, weight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.cream,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text(
                    'KODE BOOKING E-TIKET ANDA',
                    style: AppText.poppins(
                      10,
                      weight: FontWeight.w500,
                      color: AppColors.muted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SelectableText(
                    order.bookingCode,
                    style: AppText.poppins(
                      18,
                      weight: FontWeight.w800,
                      color: AppColors.maroon,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
