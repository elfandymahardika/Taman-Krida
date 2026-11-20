import 'package:flutter/material.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/brand_logo.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import '../menu/service_entries.dart';
import 'widgets/event_carousel.dart';
import 'widgets/service_shortcut.dart';

/// Beranda (tab pertama): sapaan, pintasan layanan, carousel acara
/// mendatang, dan sekilas tentang TKBJ.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  /// Jumlah acara pada carousel beranda.
  static const _carouselSize = 5;

  @override
  Widget build(BuildContext context) {
    final authController = context.watch<AuthController>();
    final catalogController = context.watch<CatalogController>();
    final rentalController = context.watch<RentalController>();
    final notificationController = context.watch<NotificationController>();
    final user = authController.currentUser;
    final upcoming =
        catalogController.events
            .where((e) => !rentalController.isDatePast(e.date))
            .toList()
          ..sort((a, b) => a.date.compareTo(b.date));

    return TkbjScaffold(
      toolbarTitle: const BrandLogo(onDark: true),
      actions: [
        IconButton(
          tooltip: 'Notifikasi',
          onPressed: () =>
              Navigator.of(context).pushNamed(AppRoutes.notifications),
          icon: Badge.count(
            count: notificationController.unreadCount,
            isLabelVisible: notificationController.unreadCount > 0,
            backgroundColor: AppColors.gold,
            textColor: AppColors.maroonDark,
            child: const Icon(Icons.notifications_none_rounded),
          ),
        ),
      ],
      header: _Greeting(
        name: user?.name.split(' ').first,
        onCalendar: () => AppRoutes.open(context, AppRoutes.calendar),
        onTickets: () => AppRoutes.open(context, AppRoutes.tickets),
      ),
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
          child: _ServiceGrid(
            onOpen: (service) => AppRoutes.open(context, service.route),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _AssistantCard(
            onTap: () => Navigator.of(context).pushNamed(AppRoutes.assistant),
          ),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: _SectionTitle(
            'Acara Mendatang',
            action: 'Lihat semua',
            onAction: () => AppRoutes.open(context, AppRoutes.calendar),
          ),
        ),
        if (catalogController.loadState != LoadState.ready)
          ContentSection(child: LoadStatus.catalog(catalogController))
        else if (upcoming.isEmpty)
          ContentSection(
            child: Text(
              'Belum ada agenda terdekat. Pantau terus Kalender Acara.',
              style: AppText.poppins(13, color: AppColors.muted),
            ),
          )
        else
          ContentSection(
            padding: const EdgeInsets.only(top: 12),
            child: EventCarousel(
              events: upcoming.take(_carouselSize).toList(),
              onOpen: (event) =>
                  Navigator.of(context)
                      .pushNamed(AppRoutes.eventDetail, arguments: event.id),
            ),
          ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _SectionTitle('Tentang TKBJ'),
              const SizedBox(height: 12),
              _AboutCard(
                onTap: () => Navigator.of(context).pushNamed(AppRoutes.profile),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({
    required this.name,
    required this.onCalendar,
    required this.onTickets,
  });

  final String? name;
  final VoidCallback onCalendar;
  final VoidCallback onTickets;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          name == null ? 'Sugeng rawuh di' : 'Sugeng rawuh,',
          style: AppText.poppins(
            12,
            weight: FontWeight.w500,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          name == null ? 'Taman Krida Budaya Jawa Timur' : 'Halo, $name',
          style: AppText.playfair(26, color: AppColors.white, height: 1.25),
        ),
        const SizedBox(height: 6),
        Text(
          'Jadwal pertunjukan, tiket, dan sewa venue resmi '
          'dalam genggaman.',
          style: AppText.poppins(13, color: AppColors.blush, height: 1.5),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: _HeaderAction(
                icon: Icons.event_note_rounded,
                label: 'Lihat Acara',
                filled: true,
                onTap: onCalendar,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _HeaderAction(
                icon: Icons.confirmation_number_outlined,
                label: 'Pesan Tiket',
                onTap: onTickets,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _HeaderAction extends StatelessWidget {
  const _HeaderAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final foreground = filled ? AppColors.maroonDark : AppColors.white;
    return Material(
      color: filled ? AppColors.gold : AppColors.white.withValues(alpha: 0.12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: filled
            ? BorderSide.none
            : BorderSide(color: AppColors.white.withValues(alpha: 0.35)),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: foreground),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: foreground,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Ajakan membuka Tanya Krida (asisten AI) di beranda.
class _AssistantCard extends StatelessWidget {
  const _AssistantCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Tanya Krida, asisten AI',
      excludeSemantics: true,
      child: Material(
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          decoration: const BoxDecoration(gradient: AppGradients.tentangBanner),
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.white.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: AppColors.gold,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tanya Krida',
                          style: AppText.poppins(
                            14,
                            weight: FontWeight.w600,
                            color: AppColors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Asisten AI siap menjawab jadwal acara, tiket, '
                          'dan sewa gedung.',
                          style: AppText.poppins(
                            11,
                            color: AppColors.blush,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.gold,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ServiceGrid extends StatelessWidget {
  const _ServiceGrid({required this.onOpen});

  final ValueChanged<ServiceEntry> onOpen;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const columns = 4;
        final itemWidth = constraints.maxWidth / columns - 0.01;
        return Wrap(
          runSpacing: 14,
          children: [
            for (final service in appServices)
              SizedBox(
                width: itemWidth,
                child: ServiceShortcut(
                  icon: service.icon,
                  label: service.shortTitle,
                  onTap: () => onOpen(service),
                ),
              ),
            SizedBox(
              width: itemWidth,
              child: ServiceShortcut(
                icon: Icons.grid_view_rounded,
                label: 'Semua',
                onTap: () => AppRoutes.open(context, AppRoutes.menu),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, {this.action, this.onAction});

  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: AppText.playfair(20, color: AppColors.ink)),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.maroon,
              visualDensity: VisualDensity.compact,
            ),
            child: Text(
              action!,
              style: AppText.poppins(
                12,
                weight: FontWeight.w600,
                color: AppColors.maroon,
              ),
            ),
          ),
      ],
    );
  }
}

class _AboutCard extends StatelessWidget {
  const _AboutCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      onTap: onTap,
      child: Row(
        children: [
          const ArtworkImage(
            AppImages.fasilitasPendopo,
            width: 84,
            height: 84,
            radius: 12,
            cacheWidth: 300,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Pendopo Agung, Amphitheater & Galeri',
                  style: AppText.poppins(13, weight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Jl. Soekarno-Hatta No. 7, Kota Malang · '
                  'Disbudpar Jatim',
                  style: AppText.poppins(11, color: AppColors.muted),
                ),
                const SizedBox(height: 8),
                Text(
                  'Lihat Profil & Denah Area',
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}
