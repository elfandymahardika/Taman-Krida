import 'dart:typed_data';
import 'dart:ui';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import 'facility.dart';
import 'ticket_order.dart';

/// Slot waktu sewa (4 jam) yang bisa dipilih pada layar Cek Jadwal.
/// Nama enum sama dengan kunci `slot` di API (morning/afternoon/evening).
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

  static RentalSlot? fromKey(String? key) {
    for (final slot in values) {
      if (slot.name == key) return slot;
    }
    return null;
  }
}

/// Keadaan satu slot pada kalender ketersediaan.
enum SlotState { available, full, past }

enum RentalStatus {
  pending('Menunggu Verifikasi', AppColors.gold, AppColors.goldTint),
  approved('Disetujui · Belum Bayar', AppColors.success, Color(0x263A9D4F)),
  paid('Disetujui · Lunas', AppColors.success, Color(0x263A9D4F)),
  rejected('Ditolak', AppColors.error, Color(0x1AB3261E));

  const RentalStatus(this.label, this.color, this.background);

  final String label;
  final Color color;
  final Color background;

  /// `status` dari API: pending | approved | paid | rejected.
  static RentalStatus fromApi(String? value) =>
      values.firstWhere((s) => s.name == value, orElse: () => pending);
}

/// Berkas yang dipilih pengguna (dokumen sewa / bukti transfer).
/// [bytes] berisi isi berkas yang dikirim ke server.
class UploadedFile {
  const UploadedFile({
    required this.fileName,
    required this.sizeLabel,
    required this.type,
    this.bytes,
    this.mimeType,
  });

  /// Berkas dari pemilih file: label ukuran & jenis dihitung dari isinya.
  factory UploadedFile.fromBytes(String fileName, Uint8List bytes) {
    final ext = fileName.split('.').last.toLowerCase();
    final mime = switch (ext) {
      'pdf' => 'application/pdf',
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => 'image/jpeg',
    };
    return UploadedFile(
      fileName: fileName,
      sizeLabel: Formatters.fileSize(bytes.length),
      type: ext == 'jpeg' ? 'JPG' : ext.toUpperCase(),
      bytes: bytes,
      mimeType: mime,
    );
  }

  final String fileName;
  final String sizeLabel;

  /// "PDF" atau "JPG".
  final String type;
  final Uint8List? bytes;
  final String? mimeType;
}

/// Data sementara selama pengguna mengisi 5 langkah sewa gedung.
class RentalDraft {
  Facility? facility;
  DateTime? date;
  RentalSlot? slot;
  String activityName = '';
  String applicantName = '';
  String contact = '';

  /// Kunci = jenis dokumen (ktp/surat/proposal, lihat [RentalDocument]).
  final Map<String, UploadedFile> documents = {};

  int? get estimatedCost => slot == null ? null : facility?.rentalRate;
}

/// Dokumen wajib pengajuan sewa: kunci field di API + label tampilan.
class RentalDocument {
  const RentalDocument(this.key, this.label);

  final String key;
  final String label;

  static const all = [
    RentalDocument('ktp', 'KTP Penanggung Jawab'),
    RentalDocument('surat', 'Surat Permohonan Resmi'),
    RentalDocument('proposal', 'Proposal Kegiatan'),
  ];
}

/// Pengajuan sewa gedung yang sudah dikirim.
class RentalRequest {
  const RentalRequest({
    required this.code,
    required this.facility,
    required this.activityName,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.applicantName,
    required this.contact,
    required this.documentCount,
    required this.submittedAt,
    required this.amount,
    this.slot,
    this.status = RentalStatus.pending,
    this.payment,
    this.reviewedAt,
    this.adminNote,
    this.paymentNote,
    this.fixes = const [],
    this.paymentMethod,
    this.paidAt,
  });

  final String code;
  final Facility facility;
  final String activityName;
  final DateTime date;

  /// "08:00"; sewa yang dicatat admin bisa di luar slot standar.
  final String startTime;
  final String endTime;
  final String applicantName;
  final String contact;
  final int documentCount;
  final DateTime submittedAt;

  /// Nominal tagihan sewa.
  final int amount;
  final RentalSlot? slot;
  final RentalStatus status;

  /// Status bayar tagihan (ada setelah disetujui).
  final PaymentStatus? payment;
  final DateTime? reviewedAt;
  final String? adminNote;

  /// Catatan admin pada tagihan, mis. alasan bukti transfer ditolak.
  final String? paymentNote;
  final List<String> fixes;
  final PaymentMethod? paymentMethod;
  final DateTime? paidAt;

  /// "08:00–12:00"
  String get timeLabel => '$startTime–$endTime';

  int get durationHours {
    int hour(String t) => int.tryParse(t.split(':').first) ?? 0;
    return hour(endTime) - hour(startTime);
  }

  int get estimatedCost => amount;

  /// Bukti transfer sudah dikirim dan sedang dicek admin.
  bool get isVerifyingPayment => payment == PaymentStatus.verifying;

  /// Pengajuan yang masih/sudah memakai jadwal venue.
  bool get holdsSchedule => status != RentalStatus.rejected;

  RentalRequest copyWith({
    RentalStatus? status,
    PaymentStatus? payment,
    DateTime? reviewedAt,
    String? adminNote,
    List<String>? fixes,
    PaymentMethod? paymentMethod,
    DateTime? paidAt,
  }) {
    return RentalRequest(
      code: code,
      facility: facility,
      activityName: activityName,
      date: date,
      startTime: startTime,
      endTime: endTime,
      applicantName: applicantName,
      contact: contact,
      documentCount: documentCount,
      submittedAt: submittedAt,
      amount: amount,
      slot: slot,
      status: status ?? this.status,
      payment: payment ?? this.payment,
      reviewedAt: reviewedAt ?? this.reviewedAt,
      adminNote: adminNote ?? this.adminNote,
      paymentNote: paymentNote,
      fixes: fixes ?? this.fixes,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paidAt: paidAt ?? this.paidAt,
    );
  }
}
