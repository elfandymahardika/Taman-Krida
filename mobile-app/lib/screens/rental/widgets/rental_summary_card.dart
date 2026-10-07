import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/facility.dart';
import '../../../widgets/common/info_row.dart';

/// "Ringkasan Pengajuan" yang ikut berubah saat form diisi.
class RentalSummaryCard extends StatelessWidget {
  const RentalSummaryCard({
    super.key,
    required this.facility,
    required this.date,
    required this.startHour,
    required this.durationHours,
  });

  final Facility? facility;
  final DateTime? date;
  final int? startHour;
  final int? durationHours;

  static const _empty = '–';

  @override
  Widget build(BuildContext context) {
    final rate = facility?.ratePerHour;
    final cost = rate != null && durationHours != null
        ? rate * durationHours!
        : null;
    final schedule = [
      if (date != null) Formatters.longDate(date!),
      if (startHour != null) Formatters.hour(startHour!),
    ].join(' · ');

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
          Text('Ringkasan Pengajuan', style: AppText.playfair(16)),
          const SizedBox(height: 12),
          InfoRow(label: 'Venue', value: facility?.shortName ?? _empty),
          const SizedBox(height: 8),
          InfoRow(
            label: 'Tanggal',
            value: schedule.isEmpty ? _empty : schedule,
          ),
          const SizedBox(height: 8),
          InfoRow(
            label: 'Durasi',
            value: durationHours == null ? _empty : '$durationHours Jam',
          ),
          const SizedBox(height: 10),
          const ThinDivider(),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Estimasi Biaya',
            value: cost == null ? _empty : Formatters.rupiah(cost),
            labelStyle: AppText.poppins(13, weight: FontWeight.w700),
            valueStyle: AppText.playfair(16, color: AppColors.maroon),
          ),
        ],
      ),
    );
  }
}
