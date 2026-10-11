import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/dummy/gallery_data.dart';
import '../../routes/app_routes.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/gallery_tile.dart';

/// Virtual Galeri (node 157:1814 "mobile-virtual-galeri").
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  String _category = GalleryData.categories.first;

  @override
  Widget build(BuildContext context) {
    final items = GalleryData.items
        .where(
          (item) =>
              _category == GalleryData.categories.first ||
              item.category == _category,
        )
        .toList();

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Galeri',
          title: 'Virtual Galeri TKBJ',
          subtitle:
              'Jelajahi momen sakral pementasan budaya & keindahan artistik '
              'lewat arsip foto.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: ChipFilterBar(
            options: GalleryData.categories,
            selected: _category,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            onSelected: (value) => setState(() => _category = value),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
          child: items.isEmpty
              ? Text(
                  'Belum ada koleksi untuk kategori ini.',
                  style: AppText.poppins(12, color: AppColors.muted),
                )
              : ResponsiveGrid(
                  minItemWidth: 150,
                  maxColumns: 4,
                  children: [
                    for (final item in items)
                      GalleryTile(
                        item: item,
                        onTap: () => Navigator.of(context).pushNamed(
                          AppRoutes.galleryDetail,
                          arguments: item.id,
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
