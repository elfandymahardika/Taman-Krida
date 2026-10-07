import 'package:flutter/material.dart';

import '../../core/utils/breakpoints.dart';

/// Bagian halaman dengan latar selebar layar, tetapi kontennya dibatasi
/// [Breakpoints.maxContentWidth] dan berada di tengah (tablet/landscape).
class ContentSection extends StatelessWidget {
  const ContentSection({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color,
    this.gradient,
    this.border,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final Gradient? gradient;
  final BoxBorder? border;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: color,
        gradient: gradient,
        border: border,
      ),
      child: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: Breakpoints.maxContentWidth,
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}
