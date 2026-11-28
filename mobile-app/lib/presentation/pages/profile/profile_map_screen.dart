import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../controllers/controllers.dart';
import '../../../domain/entities/facility.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/layout/content_section.dart';
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
    final catalog = context.watch<CatalogController>();
    final facilities = catalog.facilities;
    // Profil lembaga diatur admin di dashboard (Profil & denah).
    final profile = catalog.profile;

    return TkbjScaffold(
      title: 'Profil & Denah TKBJ',
      subtitle:
          'Kenali warisan sejarah Taman Krida Budaya Jatim dan jelajahi '
          'fasilitas budaya kami.',
      headerGradient: AppGradients.profilHeader,
      children: [
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
                '*Peta © OpenStreetMap. Geser/cubit untuk menjelajah, ketuk pin untuk detail fasilitas.',
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
                profile.about,
                style: AppText.poppins(
                  13,
                  color: AppColors.muted,
                  height: 22 / 13,
                ),
              ),
              const SizedBox(height: 16),
              InfoRow(label: 'Alamat', value: profile.address),
              const SizedBox(height: 8),
              InfoRow(label: 'Jam layanan', value: profile.hours),
              const SizedBox(height: 8),
              InfoRow(label: 'Telepon', value: profile.phone),
              if (profile.whatsapp.isNotEmpty) ...[
                const SizedBox(height: 8),
                InfoRow(label: 'WhatsApp', value: profile.whatsapp),
              ],
              const SizedBox(height: 8),
              InfoRow(label: 'Pengelola', value: profile.manager),
            ],
          ),
        ),
      ],
    );
  }
}
