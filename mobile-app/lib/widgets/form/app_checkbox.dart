import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Checkbox 18px dari komponen desain ("Kosong" / "Dicentang").
class AppCheckbox extends StatelessWidget {
  const AppCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    this.hasError = false,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      checked: value,
      child: GestureDetector(
        onTap: () => onChanged(!value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: 18,
          height: 18,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: value ? AppColors.maroon : AppColors.white,
            borderRadius: BorderRadius.circular(4),
            border: value
                ? null
                : Border.all(
                    color: hasError ? AppColors.error : AppColors.border,
                    width: 1.5,
                  ),
          ),
          child: value
              ? Text(
                  '✓',
                  style: AppText.poppins(
                    11,
                    weight: FontWeight.w700,
                    color: AppColors.white,
                    height: 1,
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

/// Checkbox + teks yang ikut dapat ditekan, opsional dengan pesan error.
class LabeledCheckbox extends StatelessWidget {
  const LabeledCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    required this.label,
    this.errorText,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget label;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => onChanged(!value),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppCheckbox(
                value: value,
                onChanged: onChanged,
                hasError: errorText != null,
              ),
              const SizedBox(width: 8),
              Expanded(child: label),
            ],
          ),
        ),
        if (errorText != null) ...[
          const SizedBox(height: 4),
          Text(errorText!, style: AppText.poppins(11, color: AppColors.error)),
        ],
      ],
    );
  }
}
