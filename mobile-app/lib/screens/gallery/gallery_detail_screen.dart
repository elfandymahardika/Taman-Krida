import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/dummy/gallery_data.dart';
import '../../data/models/gallery_item.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/interactive/segmented_tabs.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/video_preview.dart';

/// Detail koleksi galeri: tab Foto (node 157:1895) dan Video (157:1959).
class GalleryDetailScreen extends StatefulWidget {
  const GalleryDetailScreen({super.key, required this.itemId});

  final String itemId;

  @override
  State<GalleryDetailScreen> createState() => _GalleryDetailScreenState();
}

class _GalleryDetailScreenState extends State<GalleryDetailScreen> {
  late final GalleryItem _item = GalleryData.byId(widget.itemId);
  int _tab = 0;
  int _index = 0;

  bool get _isVideo => _tab == 1;

  void _go(int delta) {
    setState(() => _index = (_index + delta).clamp(0, _item.photos.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    final item = _item;
    final meta = _isVideo
        ? 'Video · ${item.videoMinutes} menit · ${item.venue} · ${item.period}'
        : 'Foto · ${item.photos.length} gambar · ${item.venue} · ${item.period}';

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Beranda / Galeri / Detail',
          title: item.title,
          subtitle: item.headline,
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SegmentedTabs(
                labels: const ['Foto', '▶ Video'],
                selected: _tab,
                onChanged: (i) => setState(() => _tab = i),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 260,
                child: _isVideo
                    ? VideoPreview(
                        cover: item.cover,
                        minutes: item.videoMinutes,
                        onPlay: () => showAppToast(
                          context,
                          'Pemutar video (simulasi prototype).',
                        ),
                      )
                    : ArtworkImage(
                        item.photos[_index],
                        radius: 12,
                        cacheWidth: 1000,
                      ),
              ),
              if (!_isVideo) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: _NavButton(
                          label: '‹ Sebelumnya',
                          onTap: _index > 0 ? () => _go(-1) : null,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        '${_index + 1} / ${item.photos.length}',
                        textAlign: TextAlign.center,
                        style: AppText.poppins(12, color: AppColors.muted),
                      ),
                    ),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: _NavButton(
                          label: 'Berikutnya ›',
                          onTap: _index < item.photos.length - 1
                              ? () => _go(1)
                              : null,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (var i = 0; i < item.photos.length; i++) ...[
                        if (i > 0) const SizedBox(width: 9),
                        _Thumbnail(
                          asset: item.photos[i],
                          selected: i == _index,
                          onTap: () => setState(() => _index = i),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerLeft,
                child: PillBadge(
                  item.badge,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(item.title, style: AppText.playfair(20)),
              const SizedBox(height: 6),
              Text(meta, style: AppText.poppins(12, color: AppColors.muted)),
              const SizedBox(height: 6),
              Text(
                item.description,
                style: AppText.poppins(13, color: AppColors.muted, height: 1.6),
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: '← Kembali ke Galeri',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.maroon,
        disabledForegroundColor: AppColors.muted.withValues(alpha: 0.5),
        side: BorderSide(
          color: onTap == null ? AppColors.divider : AppColors.border,
        ),
        backgroundColor: AppColors.white,
        minimumSize: const Size(0, 36),
        padding: const EdgeInsets.symmetric(horizontal: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: AppText.poppins(12, weight: FontWeight.w600),
      ),
      child: Text(label),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({
    required this.asset,
    required this.selected,
    required this.onTap,
  });

  final String asset;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 52,
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.maroon : Colors.transparent,
            width: 2,
          ),
        ),
        child: Opacity(
          opacity: selected ? 1 : 0.7,
          child: ArtworkImage(asset, radius: 6, cacheWidth: 160),
        ),
      ),
    );
  }
}
