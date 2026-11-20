import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/app_icon.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Tab "Akun" sebelum login: manfaat akun + tombol Masuk/Daftar.
class GuestAccountScreen extends StatelessWidget {
  const GuestAccountScreen({super.key});

  static const _perks = [
    (Icons.confirmation_number_outlined, 'Simpan e-tiket pertunjukan'),
    (Icons.apartment_rounded, 'Ajukan & pantau sewa gedung'),
    (Icons.groups_outlined, 'Daftarkan sanggar / komunitas'),
    (Icons.notifications_none_rounded, 'Notifikasi status & pengingat acara'),
  ];

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      title: 'Akun',
      subtitle: 'Masuk untuk mengelola tiket, sewa gedung, dan profil Anda.',
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: AppCard(
            padding: const EdgeInsets.all(20),
            radius: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: IconBadge(
                    size: 72,
                    child: Icon(
                      Icons.person_rounded,
                      size: 40,
                      color: AppColors.maroon,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Anda belum masuk',
                  textAlign: TextAlign.center,
                  style: AppText.playfair(20),
                ),
                const SizedBox(height: 16),
                for (final (icon, label) in _perks) ...[
                  Row(
                    children: [
                      Icon(icon, size: 20, color: AppColors.gold),
                      const SizedBox(width: 10),
                      Expanded(child: Text(label, style: AppText.poppins(13))),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                const SizedBox(height: 8),
                AppButton(
                  label: 'Masuk',
                  radius: 12,
                  onPressed: () => navigator.pushNamed(AppRoutes.login),
                ),
                const SizedBox(height: 10),
                AppButton.outline(
                  label: 'Daftar Akun Baru',
                  radius: 12,
                  onPressed: () => navigator.pushNamed(AppRoutes.register),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
