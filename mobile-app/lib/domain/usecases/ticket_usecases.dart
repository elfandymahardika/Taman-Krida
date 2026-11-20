import '../entities/rental_request.dart';
import '../entities/ticket_order.dart';
import '../repositories/ticket_repository.dart';

/// Batas tiket per acara di aplikasi (server mengizinkan hingga batas
/// Pengaturan dashboard, mana yang lebih kecil).
const maxTicketsPerEvent = 4;

class GetBookingsUseCase {
  const GetBookingsUseCase(this._repository);

  final TicketRepository _repository;

  Future<List<TicketOrder>> call() => _repository.getBookings();
}

/// Membuat pesanan dari keranjang (status "Menunggu pembayaran").
class CheckoutUseCase {
  const CheckoutUseCase(this._repository);

  final TicketRepository _repository;

  Future<TicketOrder> call(List<CartLine> lines, BuyerInfo? buyer) {
    if (buyer == null || lines.isEmpty) {
      throw StateError('Data pemesan atau keranjang belum lengkap.');
    }
    return _repository.checkout(lines, buyer);
  }
}

/// Unggah bukti pembayaran tiket → "Sedang diverifikasi" admin.
class PayBookingUseCase {
  const PayBookingUseCase(this._repository);

  final TicketRepository _repository;

  Future<TicketOrder> call(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) => _repository.payBooking(code, method, proof, sender);
}
