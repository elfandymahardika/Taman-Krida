import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/ticket_order.dart';

/// Opsi metode bayar (komponen "Pilihan Metode Bayar").
class PaymentOptionTile extends StatelessWidget {
  const PaymentOptionTile({
    super.key,
    required this.method,
    required this.selected,
    required this.onTap,
  });

  final PaymentMethod method;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(12);
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: radius,
          boxShadow: selected
              ? const [
                  BoxShadow(
                    color: AppColors.maroonTint,
                    offset: Offset(0, 4),
                    blurRadius: 6,
                  ),
                ]
              : null,
        ),
        child: Material(
          color: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: radius,
            side: BorderSide(
              color: selected ? AppColors.maroon : AppColors.border,
              width: selected ? 1.5 : 1,
            ),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  SizedBox(
                    width: 20,
                    child: Center(
                      child: selected
                          ? SvgPicture.asset(
                              AppIcons.radioSelected,
                              width: 14,
                              height: 20,
                            )
                          : Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: AppColors.white,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.border,
                                  width: 1.5,
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          method.title,
                          style: AppText.poppins(14, weight: FontWeight.w700),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          method.description,
                          style: AppText.poppins(11, color: AppColors.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
