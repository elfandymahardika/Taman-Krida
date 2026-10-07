import 'dart:math';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Gambar QR tiruan (simulasi QRIS dinamis) yang dibentuk dari [seed].
/// Bukan QR asli — cukup untuk prototipe tanpa payment gateway.
class QrCodeBox extends StatelessWidget {
  const QrCodeBox({super.key, required this.seed, this.size = 180});

  final String seed;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: CustomPaint(painter: _QrPainter(seed.hashCode)),
    );
  }
}

class _QrPainter extends CustomPainter {
  _QrPainter(this.seed);

  final int seed;
  static const _modules = 25;

  @override
  void paint(Canvas canvas, Size size) {
    final cell = size.width / _modules;
    final paint = Paint()..color = AppColors.ink;
    final random = Random(seed);

    bool inFinder(int x, int y) {
      bool near(int ox, int oy) =>
          x >= ox && x < ox + 8 && y >= oy && y < oy + 8;
      return near(0, 0) || near(_modules - 8, 0) || near(0, _modules - 8);
    }

    for (var y = 0; y < _modules; y++) {
      for (var x = 0; x < _modules; x++) {
        if (inFinder(x, y)) continue;
        if (random.nextBool()) {
          canvas.drawRect(Rect.fromLTWH(x * cell, y * cell, cell, cell), paint);
        }
      }
    }

    void finder(double ox, double oy) {
      final outer = Rect.fromLTWH(ox * cell, oy * cell, cell * 7, cell * 7);
      canvas.drawRect(outer, paint);
      canvas.drawRect(outer.deflate(cell), Paint()..color = AppColors.white);
      canvas.drawRect(outer.deflate(cell * 2), paint);
    }

    finder(0, 0);
    finder(_modules - 7.0, 0);
    finder(0, _modules - 7.0);
  }

  @override
  bool shouldRepaint(_QrPainter oldDelegate) => oldDelegate.seed != seed;
}
