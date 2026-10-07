import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Toast singkat di bagian bawah layar.
void showAppToast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// Bottom sheet putih bersudut 20 dengan "handle" di atas (overlay desain).
Future<T?> showAppBottomSheet<T>(
  BuildContext context, {
  required WidgetBuilder builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppColors.white,
    barrierColor: AppColors.backdrop,
    constraints: const BoxConstraints(maxWidth: 560),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) => SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          builder(sheetContext),
        ],
      ),
    ),
  );
}

/// Isi standar bottom sheet konfirmasi: ikon, judul, deskripsi, tombol.
class SheetMessage extends StatelessWidget {
  const SheetMessage({
    super.key,
    required this.symbol,
    required this.title,
    required this.message,
    required this.actions,
    this.symbolColor = AppColors.maroon,
    this.symbolBackground = AppColors.maroonTint,
  });

  final String symbol;
  final String title;
  final String message;
  final List<Widget> actions;
  final Color symbolColor;
  final Color symbolBackground;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: symbolBackground,
            shape: BoxShape.circle,
          ),
          child: Text(symbol, style: AppText.poppins(24, color: symbolColor)),
        ),
        const SizedBox(height: 16),
        Text(title, textAlign: TextAlign.center, style: AppText.playfair(20)),
        const SizedBox(height: 16),
        Text(
          message,
          textAlign: TextAlign.center,
          style: AppText.poppins(12, color: AppColors.muted),
        ),
        for (final action in actions) ...[const SizedBox(height: 16), action],
      ],
    );
  }
}
