import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/cultural_event.dart';
import '../../routes/app_routes.dart';
import '../../controllers/controllers.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_feedback.dart';
import '../../widgets/common/artwork_image.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/common/load_status.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
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
              context.read<TicketController>().ensureInCart(event.id);
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
    final catalogController = context.watch<CatalogController>();
    final rentalController = context.watch<RentalController>();
    final event = catalogController.eventById(eventId);
    final navigator = Navigator.of(context);
    if (event == null) {
      return TkbjScaffold(
        title: 'Detail Acara',
        children: [
          ContentSection(
            child: catalogController.loadState == LoadState.ready
                ? LoadStatus(
                    loading: false,
                    error:
                        'Acara tidak ditemukan atau sudah tidak '
                        'dipublikasikan.',
                    onRetry: catalogController.load,
                  )
                : LoadStatus.catalog(catalogController),
          ),
        ],
      );
    }
    final bookable =
        event.isTicketed && !rentalController.isDatePast(event.date);

    return TkbjScaffold(
      title: event.shortTitle,
      header: _EventHeader(event: event),
      bottomBar: Row(
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event.isTicketed ? 'Harga / orang' : 'Tiket masuk',
                style: AppText.poppins(11, color: AppColors.muted),
              ),
              Text(
                event.isTicketed ? Formatters.rupiah(event.price) : 'Gratis',
                style: AppText.playfair(18, color: AppColors.maroon),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: bookable
                ? AppButton(
                    label: 'Pesan Tiket Sekarang',
                    radius: 12,
                    onPressed: () => _confirmOrder(context, event),
                  )
                : event.isTicketed
                ? const AppButton(
                    label: 'Acara Sudah Berlangsung',
                    radius: 12,
                    onPressed: null,
                  )
                : AppButton(
                    label: 'Lihat Denah Lokasi',
                    radius: 12,
                    onPressed: () => navigator.pushNamed(AppRoutes.profile),
                  ),
          ),
        ],
      ),
      children: [
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _EventInfoCard(
                event: event,
                onLocationTap: () => navigator.pushNamed(AppRoutes.profile),
              ),
              const SizedBox(height: 20),
              Text('Tentang Pertunjukan', style: AppText.playfair(18)),
              const SizedBox(height: 8),
              Text(
                event.description,
                style: AppText.poppins(13, color: AppColors.muted, height: 1.6),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Foto, kategori, judul, dan pengisi acara di header maroon.
class _EventHeader extends StatelessWidget {
  const _EventHeader({required this.event});

  final CulturalEvent event;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ArtworkImage(
          event.imageAsset,
          height: 200,
          width: double.infinity,
          radius: 16,
          cacheWidth: 1000,
        ),
        const SizedBox(height: 14),
        PillBadge(
          event.category,
          fontSize: 10,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        ),
        const SizedBox(height: 6),
        Text(
          event.title,
          style: AppText.playfair(22, color: AppColors.white, height: 1.3),
        ),
        const SizedBox(height: 4),
        Text(
          event.performer,
          style: AppText.poppins(12, color: AppColors.blush),
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
