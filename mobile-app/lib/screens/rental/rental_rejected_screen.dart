import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/utils/formatters.dart';
import '../../routes/app_routes.dart';
import '../../state/app_state.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/section_card.dart';
import '../../widgets/layout/content_section.dart';
import '../../widgets/layout/page_header.dart';
import '../../widgets/layout/tkbj_scaffold.dart';
import 'widgets/rental_not_found.dart';

/// Pengajuan sewa ditolak (node 157:1638 "mobile-sewa-ditolak").
class RentalRejectedScreen extends StatelessWidget {
  const RentalRejectedScreen({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final request = state.findRental(code);
    if (request == null) return RentalNotFound(code: code);
    final reviewed = request.reviewedAt;

    return TkbjScaffold(
      children: [
        PageHeader(
          breadcrumb: 'Sewa Gedung / Status',
          title: 'Pengajuan Ditolak',
          subtitle: 'Admin telah meninjau pengajuan Anda. Lihat catatan di bawah ini.',
          onBreadcrumbTap: () => AppRoutes.goHome(context),
        ),
        ContentSection(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(17),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.35),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 34,
                      height: 44,
                      alignment: Alignment.center,
                      child: Text(
                        '✕',
                        style: AppText.poppins(
                          22,
                          weight: FontWeight.w700,
                          color: AppColors.error,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Pengajuan ${request.code} Ditolak',
                      textAlign: TextAlign.center,
                      style: AppText.playfair(17),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Diperiksa oleh Admin Sewa Gedung'
                      '${reviewed == null ? '' : ' · ${Formatters.dateTime(reviewed)}'}',
                      textAlign: TextAlign.center,
                      style: AppText.poppins(11, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Catatan Admin',
                children: [
                  Text(
                    request.adminNote ?? '-',
                    style: AppText.poppins(
                      13,
                      color: AppColors.muted,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SectionCard(
                title: 'Yang perlu diperbaiki',
                spacing: 4,
                children: [
                  for (final fix in request.fixes)
                    Text(
                      '•  $fix',
                      style: AppText.poppins(13, color: AppColors.muted),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              AppButton(
                label: 'Ajukan Ulang',
                onPressed: () {
                  state.startRental(
                    facility: request.facility,
                    activityName: request.activityName,
                  );
                  AppRoutes.openFromHome(context, AppRoutes.rentalSchedule);
                },
              ),
              const SizedBox(height: 10),
              AppButton.outline(
                label: 'Kembali ke Beranda',
                onPressed: () => AppRoutes.goHome(context),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
