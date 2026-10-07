import 'dart:ui';

import '../../core/theme/app_colors.dart';
import 'facility.dart';

enum RentalStatus {
  pending('Menunggu Verifikasi', AppColors.gold, AppColors.goldTint),
  approved('Disetujui', AppColors.success, Color(0x263A9D4F)),
  rejected('Ditolak', AppColors.error, Color(0x1AB3261E));

  const RentalStatus(this.label, this.color, this.background);

  final String label;
  final Color color;
  final Color background;
}

/// Pengajuan sewa gedung dari formulir kegiatan.
class RentalRequest {
  const RentalRequest({
    required this.code,
    required this.facility,
    required this.activityName,
    required this.date,
    required this.startHour,
    required this.durationHours,
    required this.applicantName,
    required this.contact,
    this.status = RentalStatus.pending,
  });

  final String code;
  final Facility facility;
  final String activityName;
  final DateTime date;
  final int startHour;
  final int durationHours;
  final String applicantName;
  final String contact;
  final RentalStatus status;

  int get estimatedCost => (facility.ratePerHour ?? 0) * durationHours;
}
