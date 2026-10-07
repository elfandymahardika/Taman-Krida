import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/facility.dart';

/// Kotak peta 240px dengan pin bernomor. Posisi pin relatif terhadap
/// ukuran peta sehingga tetap tepat di layar sempit maupun lebar.
class InteractiveMap extends StatelessWidget {
  const InteractiveMap({
    super.key,
    required this.facilities,
    required this.onPinTap,
  });

  final List<Facility> facilities;
  final ValueChanged<Facility> onPinTap;

  static const _pinSize = 24.0;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 240,
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final height = constraints.maxHeight;
          return Stack(
            children: [
              for (final facility in facilities)
                Positioned(
                  left: facility.mapPosition.dx * width - _pinSize / 2,
                  top: facility.mapPosition.dy * height - _pinSize / 2,
                  child: _MapPin(
                    number: facility.number,
                    label: facility.name,
                    onTap: () => onPinTap(facility),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({
    required this.number,
    required this.label,
    required this.onTap,
  });

  final int number;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: InteractiveMap._pinSize,
          height: InteractiveMap._pinSize,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.maroon,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.white, width: 1.5),
          ),
          child: Text(
            '$number',
            style: AppText.poppins(
              11,
              weight: FontWeight.w700,
              color: AppColors.white,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}
