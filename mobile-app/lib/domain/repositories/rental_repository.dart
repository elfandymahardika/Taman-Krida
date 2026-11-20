import '../entities/app_meta.dart';
import '../entities/facility.dart';
import '../entities/rental_request.dart';
import '../entities/ticket_order.dart';

/// Kontrak sewa gedung: ketersediaan jadwal, pengajuan, dan pembayaran.
abstract interface class RentalRepository {
  Future<Availability> getAvailability(Facility facility, DateTime month);
  Future<List<RentalRequest>> getRentals();
  Future<RentalRequest> submitRental(RentalDraft draft);
  Future<RentalRequest> payRental(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );
}
