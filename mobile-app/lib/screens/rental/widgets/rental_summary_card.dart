import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/facility.dart';
import '../../../data/models/rental_request.dart';
import '../../../widgets/common/info_row.dart';
import '../../../widgets/common/section_card.dart';

/// "Ringkasan Pengajuan": venue, tanggal, durasi, dan estimasi biaya.
class RentalSummaryCard extends StatelessWidget {
  const RentalSummaryCard({
    super.key,
    required this.facility,
    required this.date,
    required this.slot,
    this.amount,
    this.timeLabel,
    this.title = 'Ringkasan Pengajuan',
    this.showRate = false,
    this.footer = const [],
  });

  final Facility? facility;
  final DateTime? date;
  final RentalSlot? slot;

  /// Nominal tagihan dari server; bila kosong dipakai tarif venue.
  final int? amount;

  /// Jam sewa dari server ("09:00–17:00"), untuk sewa di luar slot standar.
  final String? timeLabel;
  final String title;

  /// Tampilkan baris "Tarif" (dipakai di halaman pembayaran).
  final bool showRate;

  /// Widget tambahan di bawah ringkasan, mis. tombol aksi.
  final List<Widget> footer;

  static const _empty = '–';

  @override
  Widget build(BuildContext context) {
    final rate = facility?.rentalRate;
    final cost = amount ?? (slot != null ? rate : null);
    final hours = slot?.hours;
    final schedule = [
      if (date != null) Formatters.longDate(date!),
      if (timeLabel != null)
        timeLabel!
      else if (slot != null)
        showRate ? slot!.shortLabel : Formatters.hour(slot!.startHour),
    ].join(' · ');

    return SectionCard(
      title: title,
      borderColor: AppColors.border,
      borderWidth: 1.5,
      children: [
        InfoRow(label: 'Venue', value: facility?.name ?? _empty),
        InfoRow(label: 'Tanggal', value: schedule.isEmpty ? _empty : schedule),
        if (showRate && cost != null)
          InfoRow(
            label: 'Tarif',
            value: '${Formatters.rupiah(cost)} / pemakaian',
          )
        else
          InfoRow(
            label: 'Durasi',
            value: hours == null ? _empty : '$hours Jam',
          ),
        const ThinDivider(),
        InfoRow(
          label: showRate ? 'Total Pembayaran' : 'Estimasi Biaya',
          value: cost == null ? _empty : Formatters.rupiah(cost),
          labelStyle: AppText.poppins(13, weight: FontWeight.w700),
          valueStyle: AppText.playfair(16, color: AppColors.maroon),
        ),
        ...footer,
      ],
    );
  }
}
