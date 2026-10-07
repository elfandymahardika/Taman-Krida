import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Indikator langkah checkout: ✓ (selesai), angka maroon (aktif),
/// angka abu (belum).
class StepTracker extends StatelessWidget {
  const StepTracker({super.key, required this.current, this.total = 4});

  /// Langkah aktif, dimulai dari 1.
  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var step = 1; step <= total; step++) ...[
            _StepCircle(step: step, current: current),
            if (step < total) ...[
              const SizedBox(width: 4),
              Container(
                width: 24,
                height: 1.5,
                color: step < current ? AppColors.maroon : AppColors.divider,
              ),
              const SizedBox(width: 8),
            ],
          ],
        ],
      ),
    );
  }
}

class _StepCircle extends StatelessWidget {
  const _StepCircle({required this.step, required this.current});

  final int step;
  final int current;

  @override
  Widget build(BuildContext context) {
    final done = step < current;
    final reached = step <= current;
    return Container(
      width: 22,
      height: 22,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: reached ? AppColors.maroon : AppColors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: reached ? AppColors.maroon : AppColors.muted,
          width: 1.5,
        ),
      ),
      child: Text(
        done ? '✓' : '$step',
        style: AppText.poppins(
          11,
          weight: FontWeight.w700,
          color: reached ? AppColors.white : AppColors.muted,
          height: 1,
        ),
      ),
    );
  }
}
