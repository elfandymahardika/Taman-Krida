import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Stepper 5 langkah sewa gedung (Venue → Jadwal → Formulir → Berkas →
/// Verifikasi). Setiap langkah mendapat kolom selebar sama sehingga tidak
/// pernah overflow di layar sempit; label mengecil bila perlu.
class RentalStepper extends StatelessWidget {
  const RentalStepper({super.key, required this.current});

  /// Langkah aktif, 1–5.
  final int current;

  static const _labels = [
    'Venue',
    'Jadwal',
    'Formulir',
    'Berkas',
    'Verifikasi',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 13),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < _labels.length; i++)
            Expanded(
              child: _Step(
                number: i + 1,
                label: _labels[i],
                current: current,
                isFirst: i == 0,
                isLast: i == _labels.length - 1,
              ),
            ),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({
    required this.number,
    required this.label,
    required this.current,
    required this.isFirst,
    required this.isLast,
  });

  final int number;
  final String label;
  final int current;
  final bool isFirst;
  final bool isLast;

  /// Setengah garis penghubung; [left] menempel ke langkah sebelumnya.
  Widget _connector({
    required bool left,
    required bool visible,
    required bool reached,
  }) {
    return Expanded(
      child: Container(
        height: 1.5,
        margin: left
            ? const EdgeInsets.only(right: 4)
            : const EdgeInsets.only(left: 4),
        color: !visible
            ? Colors.transparent
            : reached
            ? AppColors.maroon
            : AppColors.divider,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final done = number < current;
    final reached = number <= current;
    final isCurrent = number == current;

    return Column(
      children: [
        Row(
          children: [
            _connector(left: true, visible: !isFirst, reached: reached),
            Container(
              width: 24,
              height: 24,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: reached ? AppColors.maroon : AppColors.white,
                shape: BoxShape.circle,
                border: Border.all(
                  color: reached ? AppColors.maroon : AppColors.border,
                  width: 1.5,
                ),
              ),
              child: Text(
                done ? '✓' : '$number',
                style: AppText.poppins(
                  11,
                  weight: FontWeight.w700,
                  color: reached ? AppColors.white : AppColors.muted,
                  height: 1,
                ),
              ),
            ),
            _connector(
              left: false,
              visible: !isLast,
              reached: number < current,
            ),
          ],
        ),
        const SizedBox(height: 4),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            label,
            maxLines: 1,
            style: AppText.poppins(
              10,
              weight: isCurrent ? FontWeight.w600 : FontWeight.w400,
              color: isCurrent ? AppColors.maroon : AppColors.muted,
            ),
          ),
        ),
      ],
    );
  }
}
