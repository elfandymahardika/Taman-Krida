import '../entities/app_meta.dart';
import '../entities/facility.dart';
import '../entities/rental_request.dart';
import '../entities/ticket_order.dart';
import '../repositories/rental_repository.dart';

class GetAvailabilityUseCase {
  const GetAvailabilityUseCase(this._repository);

  final RentalRepository _repository;

  Future<Availability> call(Facility facility, DateTime month) =>
      _repository.getAvailability(facility, month);
}

class GetRentalsUseCase {
  const GetRentalsUseCase(this._repository);

  final RentalRepository _repository;

  Future<List<RentalRequest>> call() => _repository.getRentals();
}

/// Kirim pengajuan sewa + 3 berkas. Venue, tanggal, dan slot wajib dipilih.
class SubmitRentalUseCase {
  const SubmitRentalUseCase(this._repository);

  final RentalRepository _repository;

  Future<RentalRequest> call(RentalDraft draft) {
    if (draft.facility == null || draft.date == null || draft.slot == null) {
      throw StateError('Venue, tanggal, dan slot belum dipilih.');
    }
    return _repository.submitRental(draft);
  }
}

/// Unggah bukti pembayaran tagihan sewa → "Sedang diverifikasi".
class PayRentalUseCase {
  const PayRentalUseCase(this._repository);

  final RentalRepository _repository;

  Future<RentalRequest> call(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) => _repository.payRental(code, method, proof, sender);
}
