import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../domain/entities/culture_topic.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/open_external.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/common/video_preview.dart';
import '../../widgets/interactive/underline_tabs.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'video_player_screen.dart';

/// Detail materi edukasi dengan tab Sejarah (node 157:2386), Filosofi
/// (157:2453), dan Foto/Video (157:2534).
class EducationDetailScreen extends StatefulWidget {
  const EducationDetailScreen({super.key, required this.args});

  final EducationArgs args;

  @override
  State<EducationDetailScreen> createState() => _EducationDetailScreenState();
}

class _EducationDetailScreenState extends State<EducationDetailScreen> {
  late int _tab = widget.args.initialTab;

  @override
  Widget build(BuildContext context) {
    final topic = context.watch<EducationController>().topicById(
      widget.args.topicId,
    );
    // Materi bisa ditarik admin saat layar ini terbuka.
    if (topic == null) {
      return TkbjScaffold(
        title: 'Materi tidak tersedia',
        subtitle: 'Materi ini sudah tidak diterbitkan.',
        children: [
          ContentSection(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
            child: AppButton(
              label: 'Lihat Materi Lain',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ],
      );
    }

    return TkbjScaffold(
      title: topic.title,
      subtitle: topic.headline,
      children: [
        UnderlineTabs(
          labels: const ['Sejarah', 'Filosofi', 'Foto / Video'],
          selected: _tab,
          onChanged: (i) => setState(() => _tab = i),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ArtworkImage(
                topic.imageAsset,
                height: 180,
                radius: 12,
                cacheWidth: 1000,
              ),
              const SizedBox(height: 16),
              ...switch (_tab) {
                0 => _historyTab(topic),
                1 => _philosophyTab(topic),
                _ => _mediaTab(topic),
              },
              const SizedBox(height: 16),
              AppButton(
                label: 'Selesai, Kembali ke Beranda',
                onPressed: () => AppRoutes.goHome(context),
              ),
            ],
          ),
        ),
      ],
    );
  }

  List<Widget> _historyTab(CultureTopic topic) => [
    Text('Sejarah ${topic.title}', style: AppText.playfair(18)),
    const SizedBox(height: 16),
    Text(
      topic.history,
      style: AppText.poppins(13, color: AppColors.muted, height: 1.6),
    ),
    const SizedBox(height: 16),
    SectionCard(
      title: topic.timelineTitle,
      spacing: 12,
      children: [
        for (final point in topic.timeline)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.maroonTint,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  point.label,
                  style: AppText.poppins(
                    11,
                    weight: FontWeight.w700,
                    color: AppColors.maroon,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  point.text,
                  style: AppText.poppins(12, color: AppColors.ink),
                ),
              ),
            ],
          ),
      ],
    ),
  ];

  List<Widget> _philosophyTab(CultureTopic topic) => [
    Text('Makna di Balik ${topic.title}', style: AppText.playfair(18)),
    for (final point in topic.philosophy) ...[
      const SizedBox(height: 16),
      SectionCard(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.goldTint,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  point.symbol,
                  style: AppText.poppins(14, color: AppColors.gold),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      point.title,
                      style: AppText.poppins(14, weight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      point.text,
                      style: AppText.poppins(12, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    ],
  ];

  /// Berkas video diputar di aplikasi; YouTube/tautan lain dibuka di luar.
  void _playVideo(CultureTopic topic, CultureVideo video) {
    if (video.playsInApp) {
      Navigator.of(context).pushNamed(
        AppRoutes.videoPlayer,
        arguments: VideoArgs(url: video.url, title: topic.title),
      );
    } else {
      openExternal(context, video.url);
    }
  }

  static String _videoCaption(CultureTopic topic, CultureVideo video) {
    final minutes = topic.videoMinutes > 0
        ? ' · ${topic.videoMinutes} menit'
        : '';
    return switch (video.type) {
      CultureVideoType.file => 'Video dokumenter$minutes',
      CultureVideoType.youtube => 'Tonton di YouTube$minutes',
      CultureVideoType.link => 'Buka video$minutes',
    };
  }

  List<Widget> _mediaTab(CultureTopic topic) => [
    Text('Dokumentasi', style: AppText.playfair(18)),
    if (topic.video case final video?) ...[
      const SizedBox(height: 16),
      SizedBox(
        height: 190,
        child: VideoPreview(
          cover: topic.imageAsset,
          minutes: topic.videoMinutes,
          caption: _videoCaption(topic, video),
          onPlay: () => _playVideo(topic, video),
        ),
      ),
    ],
    const SizedBox(height: 16),
    if (topic.photos.isEmpty)
      Text(
        'Belum ada foto dokumentasi untuk materi ini.',
        style: AppText.poppins(12, color: AppColors.muted),
      )
    else
      ResponsiveGrid(
        spacing: 10,
        minItemWidth: 140,
        maxColumns: 4,
        children: [
          for (final photo in topic.photos)
            ArtworkImage(photo, height: 120, radius: 10, cacheWidth: 400),
        ],
      ),
  ];
}
