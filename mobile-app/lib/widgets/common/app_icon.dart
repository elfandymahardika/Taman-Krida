import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/theme/app_colors.dart';

/// Ikon SVG dari desain, ditampilkan pada ukuran aslinya.
class AppIcon extends StatelessWidget {
  const AppIcon(this.asset, {super.key, this.size = 18});

  final String asset;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(asset, width: size, height: size);
  }
}

/// Lingkaran maroon 10% berisi ikon atau simbol teks.
class IconBadge extends StatelessWidget {
  const IconBadge({super.key, required this.child, this.size = 36});

  final Widget child;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: AppColors.maroonTint,
        shape: BoxShape.circle,
      ),
      child: child,
    );
  }
}
