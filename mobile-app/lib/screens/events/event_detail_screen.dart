import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/cultural_event.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Detail acara (node 1:530) + overlay "Ingin memesan tiket?" (node 1:597).
class EventDetailScreen extends StatelessWidget {
  const EventDetailScreen({super.key, required this.eventId});

  final String eventId;

  void _confirmOrder(BuildContext context, CulturalEvent event) {
    showAppBottomSheet<void>(
      context,
      builder: (sheetContext) => SheetMessage(
        symbol: '🎟',
        title: 'Ingin memesan tiket?',
        message:
            '${event.title} · ${Formatters.shortDate(event.date)} · '
            '${Formatters.rupiah(event.price)} / orang',
        actions: [
          AppButton(
            label: 'Ya, Pesan Tiket',
            onPressed: () {
              AppStateScope.read(context).ensureInCart(event.id);
              Navigator.of(sheetContext).pop();
              Navigator.of(context).pushNamed(AppRoutes.tickets);
            },
          ),
          AppButton.outline(
            label: 'Tidak, Kembali ke Beranda',
            onPressed: () {
              Navigator.of(sheetContext).pop();
              AppRoutes.goHome(context);
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final event = state.eventById(eventId);
    final navigator = Navigator.of(context);
    final header = PageHeader(
      breadcrumb: 'Beranda / Kalender Acara / Detail',
      title: 'Detail Acara',
      subtitle: 'Informasi lengkap pertunjukan sebelum Anda memesan tiket.',
      onBreadcrumbTap: () => AppRoutes.goHome(context),
    );

    if (event == null) {
      return TkbjScaffold(
        children: [
          header,
          ContentSection(
            child: state.catalogState == LoadState.ready
                ? LoadStatus(
                    loading: false,
                    error:
                        'Acara tidak ditemukan atau sudah tidak '
                        'dipublikasikan.',
                    onRetry: state.loadCatalog,
                  )
                : LoadStatus.catalog(state),
          ),
        ],
      );
    }
    final bookable = event.isTicketed && !state.isDatePast(event.date);

    return TkbjScaffold(
      children: [
        header,
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  event.imageAsset,
                  height: 200,
                  fit: BoxFit.cover,
                  cacheWidth: 1000,
                ),
              ),
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerLeft,
                child: PillBadge(
                  event.category,
                  fontSize: 10,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 3,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(event.title, style: AppText.playfair(22)),
              const SizedBox(height: 6),
              Text(
                event.performer,
                style: AppText.poppins(12, color: AppColors.muted),
              ),
              const SizedBox(height: 16),
              _EventInfoCard(
                event: event,
                onLocationTap: () => navigator.pushNamed(AppRoutes.profile),
              ),
              const SizedBox(height: 16),
              Text('Tentang Pertunjukan', style: AppText.playfair(18)),
              const SizedBox(height: 8),
              Text(
                event.description,
                style: AppText.poppins(13, color: AppColors.muted, height: 1.6),
              ),
              const SizedBox(height: 16),
              if (bookable)
                AppButton(
                  label: 'Pesan Tiket Sekarang',
                  onPressed: () => _confirmOrder(context, event),
                )
              else if (event.isTicketed)
                const AppButton(
                  label: 'Acara Sudah Berlangsung',
                  onPressed: null,
                )
              else
                AppButton(
                  label: 'Masuk Gratis · Lihat Denah Lokasi',
                  onPressed: () => navigator.pushNamed(AppRoutes.profile),
                ),
              const SizedBox(height: 10),
              AppButton.outline(
                label: '← Kembali ke Kalender',
                onPressed: () => navigator.pop(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EventInfoCard extends StatelessWidget {
  const _EventInfoCard({required this.event, required this.onLocationTap});

  final CulturalEvent event;
  final VoidCallback onLocationTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          InfoRow(label: 'Tanggal', value: Formatters.fullDate(event.date)),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Waktu',
            value: '${event.startTime} – ${event.endTime} WIB',
          ),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Lokasi',
            value: event.venue,
            onValueTap: onLocationTap,
          ),
          if (event.isTicketed) ...[
            const SizedBox(height: 10),
            InfoRow(
              label: 'Kuota tersisa',
              value: '${event.quotaLeft} dari ${event.quotaTotal} kursi',
            ),
          ],
          const SizedBox(height: 10),
          const ThinDivider(),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Harga tiket',
            value: event.isTicketed ? Formatters.rupiah(event.price) : 'Gratis',
            valueStyle: AppText.playfair(
              18,
              weight: FontWeight.w600,
              color: AppColors.maroon,
            ),
          ),
        ],
      ),
    );
  }
}
