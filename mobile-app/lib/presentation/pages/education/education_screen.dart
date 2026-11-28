import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/topic_card.dart';

/// Daftar materi Edukasi Budaya (node 157:2294 "mobile-edukasi-budaya").
/// Materi dikelola admin di dashboard → Edukasi.
class EducationScreen extends StatefulWidget {
  const EducationScreen({super.key});

  @override
  State<EducationScreen> createState() => _EducationScreenState();
}

class _EducationScreenState extends State<EducationScreen> {
  String _category = EducationController.all;

  @override
  void initState() {
    super.initState();
    // Materi terbaru dari admin: muat ulang diam-diam setiap layar dibuka.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final education = context.read<EducationController>();
      education.isReady ? education.refresh() : education.ensureLoaded();
    });
  }

  Future<void> _refresh() async {
    final error = await context.read<EducationController>().refresh();
    if (error != null && mounted) showAppToast(context, error);
  }

  @override
  Widget build(BuildContext context) {
    final educationController = context.watch<EducationController>();
    // Kategori terpilih bisa hilang bila admin mengubah materi.
    final category = educationController.categories.contains(_category)
        ? _category
        : EducationController.all;
    final topics = educationController.topicsIn(category);
    final ready = educationController.isReady;

    return TkbjScaffold(
      title: 'Edukasi Budaya',
      onRefresh: _refresh,
      subtitle:
          'Pelajari sejarah, filosofi, dan dokumentasi kesenian tradisi '
          'Jawa Timur.',
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pilih Materi', style: AppText.playfair(18)),
              const SizedBox(height: 4),
              Text(
                ready ? '${topics.length} materi tersedia' : 'Memuat materi…',
                style: AppText.poppins(12, color: AppColors.muted),
              ),
            ],
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.only(top: 16),
          child: ChipFilterBar(
            options: educationController.categories,
            selected: category,
            onSelected: (value) => setState(() => _category = value),
          ),
        ),
        ContentSection(
          child: !ready
              ? LoadStatus(
                  loading: educationController.loadState != LoadState.error,
                  error: educationController.error,
                  onRetry: educationController.load,
                  loadingText: 'Memuat materi edukasi…',
                )
              : topics.isEmpty
              ? Text(
                  'Belum ada materi edukasi yang diterbitkan.',
                  style: AppText.poppins(12, color: AppColors.muted),
                )
              : ResponsiveGrid(
                  spacing: 16,
                  children: [
                    for (final topic in topics)
                      TopicCard(
                        topic: topic,
                        onTap: () => Navigator.of(context).pushNamed(
                          AppRoutes.educationDetail,
                          arguments: EducationArgs(topic.id),
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
