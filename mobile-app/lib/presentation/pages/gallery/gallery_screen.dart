import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/load_status.dart';
import '../../routes/app_routes.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
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
  static const _all = 'Semua';
  String _category = _all;

  @override
  Widget build(BuildContext context) {
    final catalogController = context.watch<CatalogController>();
    // Chip kategori mengikuti koleksi yang ada di galeri.
    final categories = [
      _all,
      ...{for (final item in catalogController.gallery) item.category},
    ];
    final items = catalogController.gallery
        .where((item) => _category == _all || item.category == _category)
        .toList();

    return TkbjScaffold(
      title: 'Virtual Galeri TKBJ',
      subtitle:
          'Jelajahi momen sakral pementasan budaya & keindahan artistik '
          'lewat arsip foto.',
      children: [
        ContentSection(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: ChipFilterBar(
            options: categories,
            selected: _category,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            onSelected: (value) => setState(() => _category = value),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
          child: catalogController.loadState != LoadState.ready
              ? LoadStatus.catalog(catalogController)
              : items.isEmpty
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
