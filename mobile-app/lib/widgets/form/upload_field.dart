import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/models/rental_request.dart';
import '../common/dashed_border_box.dart';
import '../common/pill_badge.dart';

/// Komponen "Unggah Berkas" (State=Kosong / State=Terunggah).
class UploadField extends StatelessWidget {
  const UploadField({
    super.key,
    required this.label,
    required this.file,
    required this.onPick,
    this.hint = 'Ketuk untuk memilih berkas · PDF/JPG maks. 5 MB',
    this.hasError = false,
  });

  final String label;
  final UploadedFile? file;

  /// Dipanggil saat kotak kosong ditekan, atau berkas ditekan untuk diganti.
  final VoidCallback onPick;
  final String hint;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    final uploaded = file;
    if (uploaded == null) {
      return Semantics(
        button: true,
        label: 'Unggah $label',
        child: GestureDetector(
          onTap: onPick,
          child: DashedBorderBox(
            color: hasError ? AppColors.error : AppColors.border,
            radius: 12,
            background: AppColors.cream,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.maroonTint,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '↑',
                    style: AppText.poppins(
                      18,
                      weight: FontWeight.w700,
                      color: AppColors.maroon,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Unggah $label',
                  textAlign: TextAlign.center,
                  style: AppText.poppins(13, weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  hint,
                  textAlign: TextAlign.center,
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: onPick,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Row(
          children: [
            Container(
              width: 39,
              height: 35,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.maroonTint,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                uploaded.type,
                style: AppText.poppins(
                  10,
                  weight: FontWeight.w700,
                  color: AppColors.maroon,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppText.poppins(13, weight: FontWeight.w600),
                  ),
                  Text(
                    '${uploaded.fileName} · ${uploaded.sizeLabel}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.poppins(11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const PillBadge(
              '✓ Terunggah',
              color: AppColors.success,
              background: Color(0x263A9D4F),
              fontSize: 10,
              weight: FontWeight.w600,
            ),
          ],
        ),
      ),
    );
  }
}
