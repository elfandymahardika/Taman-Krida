import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../data/models/community.dart';
import '../../../routes/app_routes.dart';
import '../../../widgets/common/app_button.dart';
import '../../../widgets/common/app_feedback.dart';

/// Tombol hijau khas WhatsApp.
class WhatsAppButton extends StatelessWidget {
  const WhatsAppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.height = 38,
  });

  static const _green = Color(0xFF25A35A);

  final String label;
  final VoidCallback onPressed;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _green,
      borderRadius: BorderRadius.circular(8),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          height: height,
          child: Center(
            child: Text(
              label,
              style: AppText.poppins(
                12,
                weight: FontWeight.w600,
                color: AppColors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Overlay "Hubungi Sanggar" (node 157:2197).
Future<void> showContactSheet(BuildContext context, Community community) {
  return showAppBottomSheet<void>(
    context,
    builder: (sheetContext) => SheetMessage(
      symbol: '💬',
      title: 'Hubungi ${community.name}',
      message:
          'Anda akan diarahkan ke WhatsApp ${community.phone} dengan pesan '
          'pembuka otomatis dari aplikasi TKBJ.',
      actions: [
        AppButton(
          label: 'Buka WhatsApp',
          onPressed: () {
            Navigator.of(sheetContext).pop();
            showAppToast(
              context,
              'Membuka WhatsApp ${community.phone} (simulasi prototype).',
            );
          },
        ),
        AppButton.outline(
          label: 'Selesai, Kembali ke Beranda',
          onPressed: () {
            Navigator.of(sheetContext).pop();
            AppRoutes.goHome(context);
          },
        ),
      ],
    ),
  );
}
