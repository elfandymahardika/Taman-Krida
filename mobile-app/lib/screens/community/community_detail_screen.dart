import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/dummy/community_data.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/whatsapp_button.dart';

/// Detail komunitas (node 157:2116 "mobile-komunitas-detail").
class CommunityDetailScreen extends StatelessWidget {
  const CommunityDetailScreen({super.key, required this.communityId});

  final String communityId;

  @override
  Widget build(BuildContext context) {
    final community = CommunityData.byId(communityId);

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Komunitas / Detail',
          title: community.name,
          subtitle: community.headline,
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ArtworkImage(
                community.imageAsset,
                height: 200,
                radius: 12,
                cacheWidth: 1000,
              ),
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerLeft,
                child: PillBadge(
                  community.category,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Spesialisasi: ${community.specialization}',
                style: AppText.poppins(12, color: AppColors.muted),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _Stat(value: '${community.foundedYear}', label: 'Berdiri'),
                  const SizedBox(width: 8),
                  _Stat(value: '${community.members}', label: 'Anggota'),
                  const SizedBox(width: 8),
                  _Stat(value: community.performances, label: 'Pentas'),
                ],
              ),
              const SizedBox(height: 16),
              Text('Tentang Sanggar', style: AppText.playfair(18)),
              const SizedBox(height: 8),
              Text(
                community.about,
                style: AppText.poppins(13, color: AppColors.muted, height: 1.6),
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Jadwal Latihan',
                children: [
                  for (final (day, time) in community.schedule)
                    InfoRow(label: day, value: time),
                  InfoRow(label: 'Tempat', value: community.place),
                ],
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Kontak',
                children: [
                  InfoRow(label: 'Ketua', value: community.leader),
                  InfoRow(label: 'WhatsApp', value: community.phone),
                  InfoRow(label: 'Alamat', value: community.address),
                ],
              ),
              const SizedBox(height: 16),
              WhatsAppButton(
                label: 'Hubungi via WhatsApp',
                height: 45,
                onPressed: () => showContactSheet(context, community),
              ),
              const SizedBox(height: 10),
              AppButton.outline(
                label: '← Kembali ke Direktori',
                onPressed: () => Navigator.of(context).pop(),
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

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: AppText.poppins(
                16,
                weight: FontWeight.w700,
                color: AppColors.maroon,
              ),
            ),
            Text(label, style: AppText.poppins(10, color: AppColors.muted)),
          ],
        ),
      ),
    );
  }
}
