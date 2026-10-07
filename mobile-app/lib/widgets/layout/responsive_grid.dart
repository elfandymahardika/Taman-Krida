import 'package:flutter/material.dart';

import '../../core/utils/breakpoints.dart';

/// Menyusun kartu dalam 1 kolom di ponsel dan 2–3 kolom di layar lebar.
class ResponsiveGrid extends StatelessWidget {
  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = 12,
    this.minItemWidth = Breakpoints.minCardWidth,
    this.maxColumns = 3,
  });

  final List<Widget> children;
  final double spacing;
  final double minItemWidth;
  final int maxColumns;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = ((width + spacing) ~/ (minItemWidth + spacing)).clamp(
          1,
          maxColumns,
        );
        final itemWidth = (width - spacing * (columns - 1)) / columns;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final child in children)
              SizedBox(width: itemWidth, child: child),
          ],
        );
      },
    );
  }
}
