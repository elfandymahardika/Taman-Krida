import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'labeled_text_field.dart';

/// Field berlabel yang nilainya diambil dari langkah sebelumnya.
/// Tautan "Ubah" kembali ke langkah tersebut.
class ReadOnlyField extends StatelessWidget {
  const ReadOnlyField({
    super.key,
    required this.label,
    required this.value,
    this.onEdit,
  });

  final String label;
  final String value;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    return FieldLabel(
      label: label,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.cream,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border, width: 1.5),
        ),
        child: Row(
          children: [
            Expanded(child: Text(value, style: AppText.poppins(13))),
            if (onEdit != null)
              GestureDetector(
                onTap: onEdit,
                child: Text(
                  'Ubah',
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
