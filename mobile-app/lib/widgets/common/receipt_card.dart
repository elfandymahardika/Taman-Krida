import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'dashed_border_box.dart';
import 'info_row.dart';
import 'pill_badge.dart';

/// Satu baris pada [ReceiptCard]. [stacked] menaruh nilai di bawah label.
class ReceiptRow {
  const ReceiptRow(this.label, this.value, {this.stacked = false});

  final String label;
  final String value;
  final bool stacked;
}

/// Kartu bukti bergaris putus-putus: e-tiket & bukti reservasi venue.
class ReceiptCard extends StatelessWidget {
  const ReceiptCard({
    super.key,
    required this.title,
    required this.rows,
    required this.codeLabel,
    required this.code,
  });

  final String title;
  final List<ReceiptRow> rows;
  final String codeLabel;
  final String code;

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
                    title,
                    style: AppText.playfair(18, color: AppColors.maroon),
                  ),
                ),
                const SizedBox(width: 8),
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
            for (var i = 0; i < rows.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              if (rows[i].stacked) ...[
                Text(
                  rows[i].label,
                  style: AppText.poppins(13, color: AppColors.muted),
                ),
                const SizedBox(height: 4),
                Text(
                  rows[i].value,
                  style: AppText.poppins(12, weight: FontWeight.w600),
                ),
              ] else
                InfoRow(
                  label: rows[i].label,
                  value: rows[i].value,
                  fontSize: 13,
                ),
            ],
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
                    codeLabel.toUpperCase(),
                    textAlign: TextAlign.center,
                    style: AppText.poppins(
                      10,
                      weight: FontWeight.w500,
                      color: AppColors.muted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SelectableText(
                    code,
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
