import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Kartu putih bersudut 12 dengan bayangan lembut, opsional dapat ditekan.
/// Kartu yang dapat ditekan sedikit mengecil saat disentuh.
class AppCard extends StatefulWidget {
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
  State<AppCard> createState() => _AppCardState();
}

class _AppCardState extends State<AppCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.circular(widget.radius);
    final borderColor = widget.borderColor;
    return AnimatedScale(
      scale: _pressed ? 0.97 : 1,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: borderRadius,
          boxShadow: widget.shadow
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
                : BorderSide(color: borderColor, width: widget.borderWidth),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: widget.onTap,
            onHighlightChanged: widget.onTap == null
                ? null
                : (pressed) => setState(() => _pressed = pressed),
            child: Padding(padding: widget.padding, child: widget.child),
          ),
        ),
      ),
    );
  }
}
