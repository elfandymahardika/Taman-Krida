import '../entities/rental_request.dart';
import '../entities/ticket_order.dart';

/// Kontrak pemesanan tiket: checkout membuat pesanan "Menunggu bayar";
/// bukti transfer membuatnya "Sedang diverifikasi" sampai admin menyatakan
/// lunas.
abstract interface class TicketRepository {
  Future<List<TicketOrder>> getBookings();
  Future<TicketOrder> checkout(List<CartLine> lines, BuyerInfo buyer);
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  );
}
