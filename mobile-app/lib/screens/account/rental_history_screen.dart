import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/rental_request.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/app_card.dart';
import '../../widgets/common/pill_badge.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/responsive_grid.dart';
import '../../widgets/layout/tkbj_scaffold.dart';

/// Riwayat sewa gedung (node 157:3050 "mobile-riwayat-sewa").
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
          subtitle: 'Pantau status setiap pengajuan sewa venue Anda.',
          onBreadcrumbTap: () =>
              AppRoutes.openFromHome(context, AppRoutes.account),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ResponsiveGrid(
                spacing: 16,
                children: [
                  for (final rental in rentals) _RentalCard(rental: rental),
                ],
              ),
              const SizedBox(height: 16),
              AppButton(
                label: '+ Ajukan Sewa Baru',
                onPressed: () {
                  AppStateScope.read(context).startRental();
                  navigator.pushNamed(AppRoutes.rental);
                },
              ),
              const SizedBox(height: 16),
              AppButton.outline(
                label: '← Kembali ke Akun',
                onPressed: () =>
                    AppRoutes.openFromHome(context, AppRoutes.account),
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
    final (String action, String route) = switch (rental.status) {
      RentalStatus.paid => ('Lihat Bukti Reservasi', AppRoutes.rentalReceipt),
      RentalStatus.approved => ('Lanjut Bayar Sewa', AppRoutes.rentalPayment),
      RentalStatus.pending => ('Lihat Status', AppRoutes.rentalStatus),
      RentalStatus.rejected => (
        'Lihat Catatan & Ajukan Ulang',
        AppRoutes.rentalRejected,
      ),
    };

    return AppCard(
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  rental.code,
                  style: AppText.poppins(13, weight: FontWeight.w600),
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
          Text(
            rental.facility.name,
            style: AppText.poppins(14, weight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            '${Formatters.longDate(rental.date)} · ${rental.slot.shortLabel}',
            style: AppText.poppins(11, color: AppColors.muted),
          ),
          const SizedBox(height: 10),
          AppButton.outline(
            label: action,
            fontSize: 13,
            onPressed: () =>
                Navigator.of(context).pushNamed(route, arguments: rental.code),
          ),
        ],
      ),
    );
  }
}
