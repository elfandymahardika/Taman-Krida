import 'dart:ui';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import 'facility.dart';
import 'ticket_order.dart';

/// Slot waktu sewa (4 jam) yang bisa dipilih pada layar Cek Jadwal.
enum RentalSlot {
  morning(8, 12),
  afternoon(13, 17),
  evening(18, 22);

  const RentalSlot(this.startHour, this.endHour);

  final int startHour;
  final int endHour;

  int get hours => endHour - startHour;

  /// "08:00 – 12:00 WIB"
  String get label =>
      '${Formatters.hour(startHour)} – ${Formatters.hour(endHour)} WIB';

  /// "08:00–12:00"
  String get shortLabel =>
      '${Formatters.hour(startHour)}–${Formatters.hour(endHour)}';
}

enum RentalStatus {
  pending('Menunggu Verifikasi', AppColors.gold, AppColors.goldTint),
  approved('Disetujui · Belum Bayar', AppColors.success, Color(0x263A9D4F)),
  paid('Disetujui · Lunas', AppColors.success, Color(0x263A9D4F)),
  rejected('Ditolak', AppColors.error, Color(0x1AB3261E));

  const RentalStatus(this.label, this.color, this.background);

  final String label;
  final Color color;
  final Color background;
}

/// Berkas yang "diunggah" (simulasi, tanpa file picker sungguhan).
class UploadedFile {
  const UploadedFile({
    required this.fileName,
    required this.sizeLabel,
    required this.type,
  });

  final String fileName;
  final String sizeLabel;

  /// "PDF" atau "JPG".
  final String type;
}

/// Data sementara selama pengguna mengisi 5 langkah sewa gedung.
class RentalDraft {
  Facility? facility;
  DateTime? date;
  RentalSlot? slot;
  String activityName = '';
  String applicantName = '';
  String contact = '';
  final Map<String, UploadedFile> documents = {};

  int? get estimatedCost {
    final rate = facility?.ratePerHour;
    final slot = this.slot;
    if (rate == null || slot == null) return null;
    return rate * slot.hours;
  }
}

/// Pengajuan sewa gedung yang sudah dikirim.
class RentalRequest {
  const RentalRequest({
    required this.code,
    required this.facility,
    required this.activityName,
    required this.date,
    required this.slot,
    required this.applicantName,
    required this.contact,
    required this.documentCount,
    required this.submittedAt,
    this.status = RentalStatus.pending,
    this.reviewedAt,
    this.adminNote,
    this.fixes = const [],
    this.paymentMethod,
  });

  final String code;
  final Facility facility;
  final String activityName;
  final DateTime date;
  final RentalSlot slot;
  final String applicantName;
  final String contact;
  final int documentCount;
  final DateTime submittedAt;
  final RentalStatus status;
  final DateTime? reviewedAt;
  final String? adminNote;
  final List<String> fixes;
  final PaymentMethod? paymentMethod;

  int get durationHours => slot.hours;

  int get estimatedCost => (facility.ratePerHour ?? 0) * durationHours;

  /// Pengajuan yang masih/sudah memakai jadwal venue.
  bool get holdsSchedule => status != RentalStatus.rejected;

  RentalRequest copyWith({
    RentalStatus? status,
    DateTime? reviewedAt,
    String? adminNote,
    List<String>? fixes,
    PaymentMethod? paymentMethod,
  }) {
    return RentalRequest(
      code: code,
      facility: facility,
      activityName: activityName,
      date: date,
      slot: slot,
      applicantName: applicantName,
      contact: contact,
      documentCount: documentCount,
      submittedAt: submittedAt,
      status: status ?? this.status,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      adminNote: adminNote ?? this.adminNote,
      fixes: fixes ?? this.fixes,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }
}
