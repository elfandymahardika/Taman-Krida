import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Stepper jumlah tiket (komponen "Qty Stepper", rentang 0–4).
class QtyStepper extends StatelessWidget {
  const QtyStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 0,
    this.max = 4,
  });

  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            symbol: '−',
            color: AppColors.muted,
            semanticLabel: 'Kurangi tiket',
            onTap: value > min ? () => onChanged(value - 1) : null,
          ),
          const SizedBox(width: 2),
          SizedBox(
            width: 14,
            child: Text(
              '$value',
              textAlign: TextAlign.center,
              style: AppText.poppins(12, weight: FontWeight.w700),
            ),
          ),
          const SizedBox(width: 2),
          _StepButton(
            symbol: '+',
            color: AppColors.maroon,
            semanticLabel: 'Tambah tiket',
            onTap: value < max ? () => onChanged(value + 1) : null,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.symbol,
    required this.color,
    required this.semanticLabel,
    required this.onTap,
  });

  final String symbol;
  final Color color;
  final String semanticLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticLabel,
      child: InkResponse(
        onTap: onTap,
        radius: 16,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: Text(
            symbol,
            style: AppText.poppins(
              14,
              weight: FontWeight.w600,
              color: onTap == null ? color.withValues(alpha: 0.4) : color,
            ),
          ),
        ),
      ),
    );
  }
}
