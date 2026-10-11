import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/dummy/community_data.dart';
import '../../routes/app_routes.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/community_card.dart';
import 'widgets/whatsapp_button.dart';

/// Direktori komunitas seni (node 157:2027 "mobile-direktori-komunitas").
class CommunityDirectoryScreen extends StatefulWidget {
  const CommunityDirectoryScreen({super.key});

  @override
  State<CommunityDirectoryScreen> createState() =>
      _CommunityDirectoryScreenState();
}

class _CommunityDirectoryScreenState extends State<CommunityDirectoryScreen> {
  String _filter = CommunityData.filters.first;

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);
    final communities = CommunityData.communities
        .where(
          (c) =>
              _filter == CommunityData.filters.first || c.category == _filter,
        )
        .toList();

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Komunitas',
          title: 'Direktori Komunitas Seni',
          subtitle:
              'Jalin kolaborasi secara langsung dengan sanggar-sanggar '
              'tradisional lokal.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: ChipFilterBar(
            options: CommunityData.filters,
            selected: _filter,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            onSelected: (value) => setState(() => _filter = value),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: _RegisterBanner(
            onRegister: () => navigator.pushNamed(AppRoutes.communityRegister),
          ),
        ),
        ContentSection(
          child: communities.isEmpty
              ? Text(
                  'Belum ada komunitas untuk kategori ini.',
                  style: AppText.poppins(12, color: AppColors.muted),
                )
              : ResponsiveGrid(
                  spacing: 16,
                  children: [
                    for (final community in communities)
                      CommunityCard(
                        community: community,
                        onTap: () => navigator.pushNamed(
                          AppRoutes.communityDetail,
                          arguments: community.id,
                        ),
                        onContact: () => showContactSheet(context, community),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _RegisterBanner extends StatelessWidget {
  const _RegisterBanner({required this.onRegister});

  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.goldTint,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Punya sanggar atau komunitas?',
                  style: AppText.poppins(13, weight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  'Daftarkan agar tampil di direktori TKBJ.',
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          FilledButton(
            onPressed: onRegister,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.maroon,
              minimumSize: const Size(0, 34),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
              textStyle: AppText.poppins(12, weight: FontWeight.w600),
            ),
            child: const Text('Daftarkan'),
          ),
        ],
      ),
    );
  }
}
