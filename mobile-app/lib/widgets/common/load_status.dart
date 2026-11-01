import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../state/app_state.dart';
import 'app_button.dart';

/// Kotak "memuat" / "gagal memuat" untuk data dari server.
class LoadStatus extends StatelessWidget {
  const LoadStatus({
    super.key,
    required this.loading,
    this.error,
    this.onRetry,
    this.loadingText = 'Memuat data…',
  });

  /// Status data publik (acara, fasilitas, galeri, komunitas) di [AppState].
  factory LoadStatus.catalog(AppState state) => LoadStatus(
    loading:
        state.catalogState == LoadState.loading ||
        state.catalogState == LoadState.idle,
    error: state.catalogState == LoadState.error ? state.catalogError : null,
    onRetry: state.loadCatalog,
  );

  final bool loading;
  final String? error;
  final VoidCallback? onRetry;
  final String loadingText;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (error != null) ...[
            Text(
              'Gagal memuat data',
              textAlign: TextAlign.center,
              style: AppText.playfair(18),
            ),
            const SizedBox(height: 6),
            Text(
              error!,
              textAlign: TextAlign.center,
              style: AppText.poppins(12, color: AppColors.muted),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              AppButton.outline(label: 'Coba Lagi', onPressed: onRetry),
            ],
          ] else if (loading) ...[
            const Center(
              child: SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.maroon,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              loadingText,
              textAlign: TextAlign.center,
              style: AppText.poppins(12, color: AppColors.muted),
            ),
          ],
        ],
      ),
    );
  }
}
