import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../common/brand_logo.dart';

/// Navbar putih di atas setiap layar: logo, tombol Masuk/Akun, dan menu.
class TkbjNavbar extends StatelessWidget {
  const TkbjNavbar({super.key, this.trailing});

  /// Mengganti tombol kanan (dipakai layar menu: "Tutup ×").
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = AppStateScope.of(context).isLoggedIn;

    return Container(
      height: 54,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
        boxShadow: [
          BoxShadow(
            color: AppColors.navShadow,
            offset: Offset(0, 2),
            blurRadius: 4,
          ),
        ],
      ),
      child: Row(
        children: [
          Semantics(
            button: true,
            label: 'Beranda',
            child: GestureDetector(
              onTap: () => AppRoutes.goHome(context),
              child: const BrandLogo(),
            ),
          ),
          const Spacer(),
          trailing ??
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _NavButton(
                    label: isLoggedIn ? 'Akun' : 'Masuk',
                    onTap: () => Navigator.of(context).pushNamed(
                      isLoggedIn ? AppRoutes.account : AppRoutes.login,
                    ),
                  ),
                  const SizedBox(width: 14),
                  _HamburgerButton(
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.menu),
                  ),
                ],
              ),
        ],
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.maroon,
      borderRadius: BorderRadius.circular(6),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Text(
            label,
            style: AppText.poppins(
              12,
              weight: FontWeight.w500,
              color: AppColors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _HamburgerButton extends StatelessWidget {
  const _HamburgerButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    Widget bar() => Container(
      width: 18,
      height: 2,
      decoration: BoxDecoration(
        color: AppColors.maroon,
        borderRadius: BorderRadius.circular(1),
      ),
    );

    return Semantics(
      button: true,
      label: 'Buka menu navigasi',
      child: InkResponse(
        onTap: onTap,
        radius: 20,
        child: SizedBox(
          width: 24,
          height: 24,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              bar(),
              const SizedBox(height: 4),
              bar(),
              const SizedBox(height: 4),
              bar(),
            ],
          ),
        ),
      ),
    );
  }
}
