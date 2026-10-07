import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/account_menu_tile.dart';

/// Akun saya (node 1:2836 "mobile-akun-saya").
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  void _confirmLogout(BuildContext context) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '→',
        title: 'Keluar dari akun?',
        message:
            'Anda perlu masuk kembali untuk melihat tiket dan riwayat sewa.',
        actions: [
          AppButton(
            label: 'Ya, Keluar',
            onPressed: () {
              AppStateScope.read(context).logout();
              Navigator.of(sheetContext).pop();
              AppRoutes.goHome(context);
              showAppToast(context, 'Anda telah keluar dari akun.');
            },
          ),
          AppButton.outline(
            label: 'Batal',
            onPressed: () => Navigator.of(sheetContext).pop(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final user = state.currentUser;
    final navigator = Navigator.of(context);

    // Sesi bisa berakhir (logout) saat layar ini masih di tumpukan.
    if (user == null) return const TkbjScaffold(children: []);

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Akun Saya',
          title: 'Akun Saya',
          subtitle: 'Kelola tiket, pengajuan sewa, dan data profil Anda.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppCard(
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: AppColors.maroon,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        Formatters.initials(user.name),
                        style: AppText.playfair(18, color: AppColors.white),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            style: AppText.poppins(16, weight: FontWeight.w600),
                          ),
                          Text(
                            user.email,
                            style: AppText.poppins(12, color: AppColors.muted),
                          ),
                          const SizedBox(height: 6),
                          PillBadge(
                            'Anggota sejak ${user.memberSince}',
                            fontSize: 10,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AppCard(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    _Stat(
                      value: state.ticketLines.length,
                      label: 'Tiket aktif',
                    ),
                    _Stat(value: state.rentals.length, label: 'Pengajuan sewa'),
                    _Stat(value: user.savedEvents, label: 'Acara disimpan'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              AccountMenuTile(
                symbol: '🎟',
                title: 'Tiket Saya',
                subtitle: 'E-tiket pertunjukan yang sudah dibeli',
                onTap: () => navigator.pushNamed(AppRoutes.myTickets),
              ),
              const SizedBox(height: 12),
              AccountMenuTile(
                symbol: '🏛',
                title: 'Riwayat Sewa Gedung',
                subtitle: 'Status pengajuan & bukti reservasi',
                onTap: () => navigator.pushNamed(AppRoutes.rentalHistory),
              ),
              const SizedBox(height: 12),
              AccountMenuTile(
                symbol: '✎',
                title: 'Edit Profil',
                subtitle: 'Nama, email, dan nomor WhatsApp',
                onTap: () => navigator.pushNamed(AppRoutes.editProfile),
              ),
              const SizedBox(height: 12),
              AccountMenuTile(
                symbol: '🔔',
                title: 'Notifikasi',
                subtitle: 'Pengingat acara & status pengajuan',
                onTap: () => navigator.pushNamed(
                  AppRoutes.comingSoon,
                  arguments: 'Notifikasi',
                ),
              ),
              const SizedBox(height: 12),
              AccountMenuTile(
                symbol: '?',
                title: 'Bantuan & Kontak',
                subtitle: 'Hubungi pengelola TKBJ',
                onTap: () => showAppToast(
                  context,
                  'Hubungi TKBJ: (0341) 123-456 · info@tkbj.jatimprov.go.id',
                ),
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: 'Keluar',
                onPressed: () => _confirmLogout(context),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            '$value',
            style: AppText.poppins(
              18,
              weight: FontWeight.w700,
              color: AppColors.maroon,
            ),
          ),
          Text(
            label,
            textAlign: TextAlign.center,
            style: AppText.poppins(10, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}
