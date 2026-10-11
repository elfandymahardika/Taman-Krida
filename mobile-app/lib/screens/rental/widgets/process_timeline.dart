import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/rental_request.dart';
import '../../../widgets/common/section_card.dart';

enum _StepState { done, current, todo }

/// Kartu "Riwayat Proses" pengajuan sewa.
class ProcessTimeline extends StatelessWidget {
  const ProcessTimeline({super.key, required this.request});

  final RentalRequest request;

  @override
  Widget build(BuildContext context) {
    final status = request.status;
    final reviewed = request.reviewedAt;
    final approved =
        status == RentalStatus.approved || status == RentalStatus.paid;

    final steps = <(String, String, _StepState)>[
      (
        'Pengajuan dikirim',
        Formatters.dateTime(request.submittedAt),
        _StepState.done,
      ),
      (
        'Berkas diterima sistem',
        '${request.documentCount} dokumen lengkap',
        _StepState.done,
      ),
      (
        'Verifikasi admin',
        approved && reviewed != null
            ? 'Disetujui · ${Formatters.dateTime(reviewed)}'
            : 'Sedang ditinjau oleh Admin Sewa Gedung',
        approved ? _StepState.done : _StepState.current,
      ),
      (
        'Pembayaran sewa',
        switch (status) {
          RentalStatus.paid =>
            'Lunas via ${request.paymentMethod?.shortLabel ?? 'transfer'}',
          RentalStatus.approved => 'Selesaikan dalam 2×24 jam',
          _ => 'Setelah pengajuan disetujui',
        },
        switch (status) {
          RentalStatus.paid => _StepState.done,
          RentalStatus.approved => _StepState.current,
          _ => _StepState.todo,
        },
      ),
      (
        'Bukti reservasi',
        'Dikirim via email & WhatsApp',
        status == RentalStatus.paid ? _StepState.done : _StepState.todo,
      ),
    ];

    return SectionCard(
      title: 'Riwayat Proses',
      spacing: 14,
      children: [
        for (final (title, subtitle, state) in steps)
          _TimelineRow(title: title, subtitle: subtitle, state: state),
      ],
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.title,
    required this.subtitle,
    required this.state,
  });

  final String title;
  final String subtitle;
  final _StepState state;

  @override
  Widget build(BuildContext context) {
    final (Color fill, Color border, String mark) = switch (state) {
      _StepState.done => (AppColors.maroon, AppColors.maroon, '✓'),
      _StepState.current => (AppColors.gold, AppColors.gold, '•'),
      _StepState.todo => (AppColors.white, AppColors.border, ''),
    };
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 20,
          height: 20,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: fill,
            shape: BoxShape.circle,
            border: Border.all(color: border, width: 1.5),
          ),
          child: Text(
            mark,
            style: AppText.poppins(
              10,
              weight: FontWeight.w700,
              color: AppColors.white,
              height: 1,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppText.poppins(
                  13,
                  weight: FontWeight.w600,
                  color: state == _StepState.todo
                      ? AppColors.muted
                      : AppColors.ink,
                ),
              ),
              Text(
                subtitle,
                style: AppText.poppins(11, color: AppColors.muted),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
