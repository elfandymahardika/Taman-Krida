import '../../core/utils/formatters.dart';
import '../../domain/entities/facility.dart';
import '../../domain/entities/rental_request.dart';
import '../../domain/entities/ticket_order.dart';
import 'json.dart';

/// Pengajuan sewa gedung dari /api/rentals.
class RentalRequestModel extends RentalRequest {
  const RentalRequestModel({
    required super.code,
    required super.facility,
    required super.activityName,
    required super.date,
    required super.startTime,
    required super.endTime,
    required super.applicantName,
    required super.contact,
    required super.documentCount,
    required super.submittedAt,
    required super.amount,
    super.slot,
    super.status,
    super.payment,
    super.reviewedAt,
    super.adminNote,
    super.paymentNote,
    super.paymentMethod,
    super.paidAt,
  });

  /// [facilityOf] mencari fasilitas dari nama venue di respons server.
  factory RentalRequestModel.fromJson(
    Json j, {
    required Facility Function(String venue, int amount) facilityOf,
  }) {
    final docs = j['documents'] as List?;
    final amount = j['amount'] as int;
    return RentalRequestModel(
      code: j['id'] as String,
      facility: facilityOf(j['venue'] as String, amount),
      activityName: j['activity'] as String,
      date: DateTime.parse(j['date'] as String),
      startTime: j['start'] as String,
      endTime: j['end'] as String,
      slot: RentalSlot.fromKey(j['slot'] as String?),
      applicantName: j['applicant'] as String,
      contact: j['contact'] as String,
      documentCount: docs?.length ?? RentalDocument.all.length,
      submittedAt: parseDate(j['submittedAt']),
      amount: amount,
      status: RentalStatus.fromApi(j['status'] as String?),
      payment: j['payment'] == null
          ? null
          : PaymentStatus.fromApi(j['payment'] as String),
      reviewedAt: parseDateOrNull(j['decidedAt']),
      adminNote: j['adminNote'] as String?,
      paymentNote: j['paymentNote'] as String?,
      paymentMethod: PaymentMethod.fromLabel(j['method'] as String?),
      paidAt: parseDateOrNull(j['paidAt']),
    );
  }

  /// Kolom teks multipart POST /api/rentals (berkas dikirim terpisah).
  static Map<String, String> draftFields(RentalDraft draft) => {
    'facilityId': draft.facility!.id,
    'date': Formatters.isoDate(draft.date!),
    'slot': draft.slot!.name,
    'activity': draft.activityName,
    'applicant': draft.applicantName,
    'contact': draft.contact,
  };
}
