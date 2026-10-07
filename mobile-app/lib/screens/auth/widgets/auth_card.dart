import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../widgets/common/info_row.dart';

/// Kartu putih bertab "Masuk | Daftar" yang dipakai halaman login & daftar.
class AuthCard extends StatelessWidget {
  const AuthCard({
    super.key,
    required this.isLogin,
    required this.onSwitchTab,
    required this.form,
    required this.footerQuestion,
    required this.footerAction,
  });

  final bool isLogin;
  final VoidCallback onSwitchTab;
  final Widget form;
  final String footerQuestion;
  final String footerAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: AppColors.cardShadow,
            offset: Offset(0, 8),
            blurRadius: 12,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.only(bottom: 12),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.divider, width: 2),
              ),
            ),
            child: Row(
              children: [
                _AuthTab(
                  label: isLogin ? 'Masuk Akun' : 'Masuk',
                  active: isLogin,
                  onTap: isLogin ? null : onSwitchTab,
                ),
                _AuthTab(
                  label: isLogin ? 'Daftar' : 'Daftar Baru',
                  active: !isLogin,
                  onTap: isLogin ? onSwitchTab : null,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: form,
          ),
          const ThinDivider(),
          const SizedBox(height: 16),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 4,
            children: [
              Text(
                footerQuestion,
                style: AppText.poppins(13, color: AppColors.muted),
              ),
              GestureDetector(
                onTap: onSwitchTab,
                child: Text(
                  footerAction,
                  style: AppText.poppins(
                    13,
                    weight: FontWeight.w700,
                    color: AppColors.maroon,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AuthTab extends StatelessWidget {
  const _AuthTab({required this.label, required this.active, this.onTap});

  final String label;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.only(bottom: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: active
                ? const Border(
                    bottom: BorderSide(color: AppColors.maroon, width: 3),
                  )
                : null,
          ),
          child: Text(
            label,
            style: AppText.poppins(
              15,
              weight: active ? FontWeight.w700 : FontWeight.w500,
              color: active ? AppColors.maroon : AppColors.muted,
            ),
          ),
        ),
      ),
    );
  }
}

/// Teks kecil berlatar merah muda untuk menampilkan error dari "server".
class FormErrorBanner extends StatelessWidget {
  const FormErrorBanner(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Text(message, style: AppText.poppins(12, color: AppColors.error)),
    );
  }
}
