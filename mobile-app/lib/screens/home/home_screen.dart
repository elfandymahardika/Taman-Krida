import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/feature_card.dart';

/// Beranda (node 1:3 "mobile-homepage").
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const _features = [
    FeatureItem(
      '◆',
      'Profil & Denah Area',
      'Sejarah singkat & peta lokasi fasilitas',
      AppRoutes.profile,
    ),
    FeatureItem(
      '◇',
      'Kalender Acara',
      'Jadwal pertunjukan & wayang bulanan',
      AppRoutes.calendar,
    ),
    FeatureItem(
      '◈',
      'Sistem Sewa Gedung',
      'Cek ketersediaan & sewa online resmi',
      AppRoutes.rental,
    ),
    FeatureItem(
      '◉',
      'Tiket Pertunjukan',
      'Pemesanan & reservasi tiket online',
      AppRoutes.tickets,
    ),
    FeatureItem(
      '▣',
      'Virtual Galeri',
      'Arsip foto & video pementasan budaya',
      AppRoutes.gallery,
    ),
    FeatureItem(
      '✦',
      'Direktori Komunitas',
      'Temukan sanggar & komunitas seni lokal',
      AppRoutes.communities,
    ),
    FeatureItem(
      '❖',
      'Edukasi Budaya',
      'Sejarah, filosofi & dokumentasi kesenian',
      AppRoutes.education,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        _Hero(
          onCalendar: () => navigator.pushNamed(AppRoutes.calendar),
          onTickets: () => navigator.pushNamed(AppRoutes.tickets),
        ),
        ContentSection(
          color: AppColors.white,
          padding: const EdgeInsets.all(20),
          child: _AboutSection(
            onProfile: () => navigator.pushNamed(AppRoutes.profile),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Fitur Utama',
                textAlign: TextAlign.center,
                style: AppText.playfair(24, color: AppColors.maroon),
              ),
              const SizedBox(height: 4),
              Text(
                'Layanan informasi & kebudayaan dalam genggaman',
                textAlign: TextAlign.center,
                style: AppText.poppins(13, color: AppColors.muted),
              ),
              const SizedBox(height: 24),
              ResponsiveGrid(
                children: [
                  for (final feature in _features)
                    FeatureCard(
                      item: feature,
                      onTap: () => navigator.pushNamed(
                        feature.route,
                        arguments: feature.arguments,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.onCalendar, required this.onTickets});

  final VoidCallback onCalendar;
  final VoidCallback onTickets;

  @override
  Widget build(BuildContext context) {
    return ContentSection(
      gradient: AppGradients.hero,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 40),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.goldTint,
              border: Border.all(color: AppColors.gold),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Disbudpar Provinsi Jawa Timur',
              style: AppText.poppins(
                11,
                weight: FontWeight.w500,
                color: AppColors.gold,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Taman Krida Budaya Jawa Timur',
            textAlign: TextAlign.center,
            style: AppText.playfair(32, color: AppColors.white),
          ),
          const SizedBox(height: 20),
          Text(
            'Pusat pelestarian & pagelaran seni budaya tradisi Jawa Timur — '
            'jadwal pertunjukan, tiket, dan sewa venue resmi.',
            textAlign: TextAlign.center,
            style: AppText.poppins(14, color: AppColors.blush),
          ),
          const SizedBox(height: 30),
          AppButton(
            label: 'Lihat Kalender Acara',
            variant: AppButtonVariant.gold,
            onPressed: onCalendar,
          ),
          const SizedBox(height: 12),
          AppButton(
            label: 'Pesan Tiket',
            variant: AppButtonVariant.outlineLight,
            borderWidth: 1.5,
            onPressed: onTickets,
          ),
        ],
      ),
    );
  }
}

class _AboutSection extends StatelessWidget {
  const _AboutSection({required this.onProfile});

  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: onProfile,
          child: Container(
            height: 200,
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            alignment: Alignment.bottomLeft,
            decoration: BoxDecoration(
              gradient: AppGradients.tentangBanner,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'Pendopo Agung TKBJ',
              style: AppText.poppins(
                12,
                weight: FontWeight.w600,
                color: AppColors.white.withValues(alpha: 0.8),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Tentang TKBJ',
          style: AppText.playfair(24, color: AppColors.maroon),
        ),
        const SizedBox(height: 12),
        Text(
          'Berlokasi di Jl. Soekarno-Hatta No. 7, Kota Malang, di bawah '
          'naungan Disbudpar Jatim. Fasilitas meliputi Pendopo Agung, '
          'Panggung Terbuka (Amphitheater), dan Gedung Kesenian & Galeri '
          'untuk wayang kulit, tari topeng malangan, ketoprak, dan jaranan.',
          style: AppText.poppins(14, color: AppColors.muted),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: onProfile,
          child: Text(
            'Lihat Profil & Denah Area  →',
            style: AppText.poppins(
              14,
              weight: FontWeight.w600,
              color: AppColors.maroon,
            ),
          ),
        ),
      ],
    );
  }
}
