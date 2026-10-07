import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/dummy/dummy_data.dart';
import '../../data/models/facility.dart';
import '../../routes/app_routes.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/facility_card.dart';
import 'widgets/facility_sheet.dart';
import 'widgets/interactive_map.dart';

/// Profil & denah area (node 1:338 "mobile-profil-denah").
class ProfileMapScreen extends StatelessWidget {
  const ProfileMapScreen({super.key});

  void _showFacility(BuildContext context, Facility facility) {
    showFacilitySheet(context, facility);
  }

  @override
  Widget build(BuildContext context) {
    final facilities = DummyData.facilities;

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Profil & Denah',
          title: 'Profil & Denah TKBJ',
          subtitle:
              'Kenali warisan sejarah Taman Krida Budaya Jatim dan jelajahi '
              'fasilitas budaya kami.',
          gradient: AppGradients.profilHeader,
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Peta Denah Interaktif',
                style: AppText.playfair(18, color: AppColors.maroon),
              ),
              const SizedBox(height: 14),
              InteractiveMap(
                facilities: facilities,
                onPinTap: (facility) => _showFacility(context, facility),
              ),
              const SizedBox(height: 14),
              Text(
                '*Peta interaktif menunjukkan titik lokasi fasilitas budaya TKBJ.',
                style: AppText.poppins(
                  11,
                  color: AppColors.muted,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          child: ResponsiveGrid(
            children: [
              for (final facility in facilities)
                FacilityCard(
                  facility: facility,
                  onTap: () => _showFacility(context, facility),
                ),
            ],
          ),
        ),
        ContentSection(
          color: AppColors.white,
          border: const Border(top: BorderSide(color: AppColors.divider)),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Sejarah & Misi Mulia',
                style: AppText.playfair(20, color: AppColors.maroon),
              ),
              const SizedBox(height: 12),
              Text(
                'Taman Krida Budaya Jawa Timur didirikan sebagai episentrum '
                'kebudayaan luhur masyarakat Jatim. Di bawah naungan '
                'Disbudpar Jatim, TKBJ berfungsi merawat eksistensi seni musik '
                '& tari tradisional khas pesisiran dan agraris agar terus '
                'dinikmati generasi mendatang.',
                style: AppText.poppins(
                  13,
                  color: AppColors.muted,
                  height: 22 / 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
