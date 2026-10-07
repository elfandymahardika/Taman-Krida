import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/info_row.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Riwayat sewa gedung: menampilkan hasil input formulir sewa.
class RentalHistoryScreen extends StatelessWidget {
  const RentalHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final rentals = AppStateScope.of(context).rentals;
    final navigator = Navigator.of(context);

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Akun Saya / Riwayat Sewa',
          title: 'Riwayat Sewa Gedung',
          subtitle: 'Pantau status pengajuan sewa venue Anda.',
          onBreadcrumbTap: () => navigator.pushNamedAndRemoveUntil(
            AppRoutes.account,
            (route) => route.isFirst,
          ),
        ),
        ContentSection(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ResponsiveGrid(
                children: [
                  for (final rental in rentals) _RentalCard(rental: rental),
                ],
              ),
              const SizedBox(height: 12),
              AppButton(
                label: '+ Ajukan Sewa Baru',
                onPressed: () => navigator.pushNamed(AppRoutes.rental),
              ),
              const SizedBox(height: 10),
              AppButton.outline(
                label: '← Kembali ke Akun',
                onPressed: () => navigator.pushNamedAndRemoveUntil(
                  AppRoutes.account,
                  (route) => route.isFirst,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RentalCard extends StatelessWidget {
  const _RentalCard({required this.rental});

  final RentalRequest rental;

  @override
  Widget build(BuildContext context) {
    final endHour = rental.startHour + rental.durationHours;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  rental.code,
                  style: AppText.poppins(
                    12,
                    weight: FontWeight.w600,
                    color: AppColors.maroon,
                  ),
                ),
              ),
              PillBadge(
                rental.status.label,
                color: rental.status.color,
                background: rental.status.background,
                fontSize: 10,
                weight: FontWeight.w700,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(rental.activityName, style: AppText.playfair(16)),
          const SizedBox(height: 10),
          InfoRow(label: 'Venue', value: rental.facility.shortName),
          const SizedBox(height: 6),
          InfoRow(label: 'Tanggal', value: Formatters.longDate(rental.date)),
          const SizedBox(height: 6),
          InfoRow(
            label: 'Waktu',
            value:
                '${Formatters.hour(rental.startHour)}–'
                '${Formatters.hour(endHour)} (${rental.durationHours} jam)',
          ),
          const SizedBox(height: 6),
          InfoRow(label: 'Pengaju', value: rental.applicantName),
          const SizedBox(height: 10),
          const ThinDivider(),
          const SizedBox(height: 10),
          InfoRow(
            label: 'Estimasi Biaya',
            value: Formatters.rupiah(rental.estimatedCost),
            valueStyle: AppText.playfair(16, color: AppColors.maroon),
          ),
        ],
      ),
    );
  }
}
