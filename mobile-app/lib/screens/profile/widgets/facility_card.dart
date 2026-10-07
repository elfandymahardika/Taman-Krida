import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/facility.dart';
import '../../../widgets/common/app_card.dart';

/// Kartu fasilitas: foto 95×86, nomor pin, nama, deskripsi, kapasitas.
class FacilityCard extends StatelessWidget {
  const FacilityCard({super.key, required this.facility, required this.onTap});

  final Facility facility;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      onTap: onTap,
      child: Row(
        children: [
          Image.asset(
            facility.imageAsset,
            width: 95,
            height: 86,
            fit: BoxFit.cover,
            cacheWidth: 300,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    NumberDot(number: facility.number),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        facility.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.poppins(13, weight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  facility.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
                const SizedBox(height: 4),
                Text(
                  facility.capacityLabel,
                  style: AppText.poppins(
                    11,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Lingkaran maroon 18px berisi nomor fasilitas.
class NumberDot extends StatelessWidget {
  const NumberDot({super.key, required this.number});

  final int number;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: AppColors.maroon,
        shape: BoxShape.circle,
      ),
      child: Text(
        '$number',
        style: AppText.poppins(
          10,
          weight: FontWeight.w700,
          color: AppColors.white,
          height: 1,
        ),
      ),
    );
  }
}
