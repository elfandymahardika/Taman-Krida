import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/ticket_order.dart';
import '../../../widgets/common/info_row.dart';

/// Kartu "Ringkasan Tiket" pada langkah checkout 1 & 2.
class OrderSummaryCard extends StatelessWidget {
  const OrderSummaryCard({super.key, required this.lines, required this.total});

  final List<CartLine> lines;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Ringkasan Tiket', style: AppText.playfair(18)),
          const SizedBox(height: 16),
          for (final line in lines) ...[
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        line.event.shortTitle,
                        style: AppText.poppins(13, weight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Jumlah: ${line.quantity} Tiket',
                        style: AppText.poppins(11, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  Formatters.rupiah(line.subtotal),
                  style: AppText.poppins(
                    13,
                    weight: FontWeight.w700,
                    color: AppColors.maroon,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          const ThinDivider(),
          const SizedBox(height: 12),
          InfoRow(
            label: 'Total Pembayaran',
            value: Formatters.rupiah(total),
            labelStyle: AppText.poppins(14, weight: FontWeight.w700),
            valueStyle: AppText.playfair(18, color: AppColors.maroon),
          ),
          const SizedBox(height: 16),
          const SecureNote(),
        ],
      ),
    );
  }
}

/// Catatan emas "Transaksi aman & instan".
class SecureNote extends StatelessWidget {
  const SecureNote({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.goldTint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text('◆', style: AppText.poppins(12, color: AppColors.gold)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Transaksi aman & instan via sistem pembayaran TKBJ.',
              style: AppText.poppins(11, weight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }
}
