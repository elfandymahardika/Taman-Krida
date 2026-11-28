import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../controllers/controllers.dart';
import '../../routes/app_routes.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Detail banner, berita, pengumuman, atau artikel budaya dari menu Konten
/// di dashboard.
class NewsDetailScreen extends StatelessWidget {
  const NewsDetailScreen({super.key, required this.newsId});

  final String newsId;

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogController>();
    final item = catalog.newsById(newsId);
    if (item == null) {
      return TkbjScaffold(
        title: 'Kabar TKBJ',
        children: [
          ContentSection(
            child: catalog.isReady
                ? const LoadStatus(
                    loading: false,
                    error: 'Kabar ini sudah tidak diterbitkan.',
                  )
                : LoadStatus.catalog(catalog),
          ),
        ],
      );
    }
    final paragraphs = [
      item.summary,
      item.body,
    ].where((t) => t.isNotEmpty).toList();
    final link = item.link;

    return TkbjScaffold(
      title: item.title,
      subtitle: Formatters.longDate(item.updatedAt),
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: PillBadge(item.type, fontSize: 11),
              ),
              const SizedBox(height: 16),
              if (paragraphs.isEmpty)
                Text(
                  'Informasi lengkap menyusul. Pantau terus aplikasi TKBJ.',
                  style: AppText.poppins(13, color: AppColors.muted),
                )
              else
                for (final text in paragraphs) ...[
                  Text(
                    text,
                    style: AppText.poppins(
                      13,
                      color: AppColors.ink,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              if (link != null) ...[
                const SizedBox(height: 8),
                AppButton(
                  label: item.cta ?? 'Selengkapnya',
                  onPressed: () => AppRoutes.openLink(context, link),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
