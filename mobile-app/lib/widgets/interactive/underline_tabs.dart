import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Tab bergaris bawah selebar layar (mis. Sejarah | Filosofi | Foto/Video).
class UnderlineTabs extends StatelessWidget {
  const UnderlineTabs({
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
    return ColoredBox(
      color: AppColors.white,
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++)
            Expanded(
              child: Semantics(
                button: true,
                selected: i == selected,
                child: InkWell(
                  onTap: () => onChanged(i),
                  child: Container(
                    height: 41,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: i == selected
                              ? AppColors.maroon
                              : AppColors.divider,
                          width: 3,
                        ),
                      ),
                    ),
                    child: Text(
                      labels[i],
                      style: AppText.poppins(
                        13,
                        weight: i == selected
                            ? FontWeight.w600
                            : FontWeight.w500,
                        color: i == selected
                            ? AppColors.maroon
                            : AppColors.muted,
                      ),
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
