import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/cultural_event.dart';
import '../../../state/app_state.dart';
import '../../../widgets/common/app_card.dart';
import '../../../widgets/interactive/qty_stepper.dart';

/// Kartu acara bertiket dengan stepper jumlah.
class TicketItemCard extends StatelessWidget {
  const TicketItemCard({
    super.key,
    required this.event,
    required this.quantity,
    required this.onQuantityChanged,
    required this.onOpenDetail,
  });

  final CulturalEvent event;
  final int quantity;
  final ValueChanged<int> onQuantityChanged;
  final VoidCallback onOpenDetail;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          GestureDetector(
            onTap: onOpenDetail,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: Image.asset(
                event.imageAsset,
                width: 86,
                height: 86,
                fit: BoxFit.cover,
                cacheWidth: 260,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: onOpenDetail,
                  child: Text(
                    event.shortTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.playfair(14),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${Formatters.shortDate(event.date)} · ${event.venueShort}',
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        Formatters.rupiah(event.price),
                        style: AppText.poppins(
                          13,
                          weight: FontWeight.w700,
                          color: AppColors.maroon,
                        ),
                      ),
                    ),
                    QtyStepper(
                      value: quantity,
                      max: AppState.maxTicketsPerEvent,
                      onChanged: onQuantityChanged,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
