import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/interactive/chip_filter_bar.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/topic_card.dart';

/// Daftar materi Edukasi Budaya (node 157:2294 "mobile-edukasi-budaya").
class EducationScreen extends StatefulWidget {
  const EducationScreen({super.key});

  @override
  State<EducationScreen> createState() => _EducationScreenState();
}

class _EducationScreenState extends State<EducationScreen> {
  String? _category;

  @override
  Widget build(BuildContext context) {
    final educationController = context.watch<EducationController>();
    final category = _category ?? educationController.categories.first;
    final topics = educationController.topicsIn(category);

    return TkbjScaffold(
      title: 'Edukasi Budaya',
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
                '${topics.length} materi tersedia',
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
          child: ResponsiveGrid(
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
