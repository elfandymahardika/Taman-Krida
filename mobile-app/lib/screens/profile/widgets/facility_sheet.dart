import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/facility.dart';
import '../../../routes/app_routes.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_feedback.dart';
import '../../../widgets/common/pill_badge.dart';

/// Overlay detail fasilitas saat pin atau kartu ditekan.
Future<void> showFacilitySheet(BuildContext context, Facility facility) {
  return showAppBottomSheet<void>(
    context,
    builder: (sheetContext) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.asset(
            facility.imageAsset,
            height: 170,
            fit: BoxFit.cover,
            cacheWidth: 900,
          ),
        ),
        const SizedBox(height: 16),
        Align(
          alignment: Alignment.centerLeft,
          child: PillBadge(
            'Titik ${facility.number}',
            fontSize: 10,
            color: AppColors.white,
            background: AppColors.maroon,
            weight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 6),
        Text(facility.name, style: AppText.playfair(20)),
        const SizedBox(height: 8),
        Text(
          facility.description,
          style: AppText.poppins(13, color: AppColors.muted),
        ),
        const SizedBox(height: 8),
        Text(
          facility.isRentable
              ? '${facility.capacityLabel} · '
                    '${Formatters.rupiah(facility.ratePerHour!)}/jam'
              : facility.capacityLabel,
          style: AppText.poppins(
            12,
            weight: FontWeight.w600,
            color: AppColors.maroon,
          ),
        ),
        const SizedBox(height: 20),
        if (facility.isRentable) ...[
          AppButton(
            label: 'Ajukan Sewa Venue Ini',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              Navigator.of(context)
                  .pushNamed(AppRoutes.rental, arguments: facility.id);
            },
          ),
          const SizedBox(height: 12),
        ],
        AppButton.outline(
          label: 'Tutup',
          onPressed: () => Navigator.of(sheetContext).pop(),
        ),
      ],
    ),
  );
}
