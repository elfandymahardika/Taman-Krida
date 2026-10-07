import 'package:flutter/material.dart';

import '../../core/constants/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_icon.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

class _MenuEntry {
  const _MenuEntry(
    this.icon,
    this.title,
    this.subtitle,
    this.route, [
    this.args,
  ]);

  final String icon;
  final String title;
  final String subtitle;
  final String route;
  final Object? args;
}

/// Menu navigasi layar penuh (node 1:99 "mobile-menu-navigasi").
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  static const _entries = [
    _MenuEntry(
      AppIcons.house,
      'Beranda',
      'Informasi utama TKBJ',
      AppRoutes.home,
    ),
    _MenuEntry(
      AppIcons.map,
      'Profil & Denah Area',
      'Sejarah dan lokasi fasilitas',
      AppRoutes.profile,
    ),
    _MenuEntry(
      AppIcons.calendarDays,
      'Kalender Acara',
      'Jadwal pertunjukan seni budaya',
      AppRoutes.calendar,
    ),
    _MenuEntry(
      AppIcons.building,
      'Sewa Gedung',
      'Ketersediaan dan sewa venue resmi',
      AppRoutes.rental,
    ),
    _MenuEntry(
      AppIcons.ticket,
      'Tiket Pertunjukan',
      'Pemesanan dan reservasi tiket',
      AppRoutes.tickets,
    ),
    _MenuEntry(
      AppIcons.images,
      'Virtual Galeri',
      'Jelajahi koleksi seni secara virtual',
      AppRoutes.comingSoon,
      'Virtual Galeri',
    ),
    _MenuEntry(
      AppIcons.users,
      'Direktori Komunitas',
      'Temukan sanggar dan komunitas seni',
      AppRoutes.comingSoon,
      'Direktori Komunitas',
    ),
    _MenuEntry(
      AppIcons.map,
      'Edukasi Budaya',
      'Sejarah & filosofi kesenian tradisi',
      AppRoutes.comingSoon,
      'Edukasi Budaya',
    ),
    _MenuEntry(
      AppIcons.house,
      'Akun Saya',
      'Tiket, riwayat sewa & profil',
      AppRoutes.account,
    ),
  ];

  void _open(BuildContext context, _MenuEntry entry) {
    final navigator = Navigator.of(context);
    if (entry.route == AppRoutes.home) {
      AppRoutes.goHome(context);
      return;
    }
    navigator.pushReplacementNamed(entry.route, arguments: entry.args);
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = AppStateScope.of(context).isLoggedIn;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      showFooter: false,
      navbarTrailing: _CloseButton(onTap: () => navigator.pop()),
      children: [
        ContentSection(
          gradient: AppGradients.pageHeader,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Menu Navigasi',
                style: AppText.playfair(
                  24,
                  color: AppColors.white,
                  height: 32 / 24,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Jelajahi informasi dan layanan TKBJ.',
                style: AppText.poppins(
                  13,
                  color: AppColors.blush,
                  height: 20 / 13,
                ),
              ),
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'HALAMAN UTAMA',
                style: AppText.poppins(
                  11,
                  weight: FontWeight.w600,
                  color: AppColors.maroon,
                  height: 16 / 11,
                ),
              ),
              for (final entry in _entries) ...[
                const SizedBox(height: 8),
                _MenuTile(entry: entry, onTap: () => _open(context, entry)),
              ],
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
          child: isLoggedIn
              ? AppButton.outline(
                  label: 'Lihat Akun Saya',
                  fontSize: 13,
                  radius: 6,
                  onPressed: () =>
                      navigator.pushReplacementNamed(AppRoutes.account),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Masuk atau daftar untuk mengakses layanan.',
                      style: AppText.poppins(
                        12,
                        color: AppColors.muted,
                        height: 18 / 12,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: AppButton(
                            label: 'Masuk',
                            fontSize: 13,
                            radius: 6,
                            onPressed: () =>
                                navigator.pushReplacementNamed(AppRoutes.login),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppButton.outline(
                            label: 'Daftar Akun',
                            fontSize: 13,
                            radius: 6,
                            onPressed: () => navigator.pushReplacementNamed(
                              AppRoutes.register,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
        ContentSection(
          color: AppColors.maroonDark,
          padding: EdgeInsets.fromLTRB(
            20,
            12,
            20,
            12 + MediaQuery.paddingOf(context).bottom,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Taman Krida Budaya Jawa Timur',
                textAlign: TextAlign.center,
                style: AppText.playfair(
                  13,
                  weight: FontWeight.w600,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Disbudpar Provinsi Jawa Timur',
                textAlign: TextAlign.center,
                style: AppText.poppins(10, color: AppColors.blush),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: 36,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Tutup',
              style: AppText.poppins(
                12,
                weight: FontWeight.w500,
                color: AppColors.maroon,
              ),
            ),
            const SizedBox(width: 8),
            const AppIcon(AppIcons.close, size: 24),
          ],
        ),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.entry, required this.onTap});

  final _MenuEntry entry;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 58),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              IconBadge(child: AppIcon(entry.icon)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.title,
                      style: AppText.poppins(
                        14,
                        weight: FontWeight.w600,
                        height: 20 / 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      entry.subtitle,
                      style: AppText.poppins(
                        11,
                        color: AppColors.muted,
                        height: 16 / 11,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              const AppIcon(AppIcons.chevronRight, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
