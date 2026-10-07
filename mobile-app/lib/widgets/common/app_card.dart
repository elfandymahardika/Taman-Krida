import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Kartu putih bersudut 12 dengan bayangan lembut, opsional dapat ditekan.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.borderColor = AppColors.divider,
    this.borderWidth = 1,
    this.radius = 12,
    this.shadow = true,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? borderColor;
  final double borderWidth;
  final double radius;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(radius);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: shadow
            ? const [
                BoxShadow(
                  color: AppColors.cardShadow,
                  offset: Offset(0, 4),
                  blurRadius: 6,
                ),
              ]
            : null,
      ),
      child: Material(
        color: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: borderRadius,
          side: borderColor == null
              ? BorderSide.none
              : BorderSide(color: borderColor!, width: borderWidth),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}
