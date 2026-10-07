import 'package:flutter/material.dart';

/// Kotak putih dengan garis putus-putus (gaya kartu e-tiket).
class DashedBorderBox extends StatelessWidget {
  const DashedBorderBox({
    super.key,
    required this.child,
    required this.color,
    this.radius = 16,
    this.padding = const EdgeInsets.all(24),
    this.background = Colors.white,
  });

  final Widget child;
  final Color color;
  final double radius;
  final EdgeInsetsGeometry padding;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedRRectPainter(color: color, radius: radius),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(radius),
        ),
        child: child,
      ),
    );
  }
}

class _DashedRRectPainter extends CustomPainter {
  _DashedRRectPainter({required this.color, required this.radius});

  final Color color;
  final double radius;
  static const _dash = 6.0;
  static const _gap = 4.0;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    ).deflate(0.5);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final path = Path()..addRRect(rrect);
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(metric.extractPath(distance, distance + _dash), paint);
        distance += _dash + _gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedRRectPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.radius != radius;
}
