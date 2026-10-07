import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

/// Dua tab berdampingan dalam satu kotak putih (mis. "Aktif | Riwayat").
class SegmentedTabs extends StatelessWidget {
  const SegmentedTabs({
    super.key,
    required this.labels,
    required this.selected,
    required this.onChanged,
  });

  final List<String> labels;
  final int selected;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: i == selected ? AppColors.maroon : null,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    labels[i],
                    style: AppText.poppins(
                      12,
                      weight: FontWeight.w600,
                      color: i == selected ? AppColors.white : AppColors.muted,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
