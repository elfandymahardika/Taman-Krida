import 'cultural_event.dart';

enum PaymentMethod {
  qris(
    'QRIS (QR Code Instan)',
    'Bayar cepat via GoPay, OVO, ShopeePay, DANA, m-Banking.',
    'QRIS',
  ),
  virtualAccount(
    'Virtual Account Bank',
    'Transfer otomatis via Bank Mandiri, BCA, BNI, BRI, Permata.',
    'Virtual Account',
  ),
  eWallet(
    'E-Wallet Direct',
    'Koneksi akun langsung untuk pembayaran sekali klik.',
    'E-Wallet',
  );

  const PaymentMethod(this.title, this.description, this.shortLabel);

  final String title;
  final String description;
  final String shortLabel;
}

/// Data pemesan yang diisi pada langkah 1 checkout.
class BuyerInfo {
  const BuyerInfo({
    required this.name,
    required this.email,
    required this.phone,
  });

  final String name;
  final String email;
  final String phone;
}

/// Satu baris keranjang: acara + jumlah tiket.
class CartLine {
  const CartLine({required this.event, required this.quantity});

  final CulturalEvent event;
  final int quantity;

  int get subtotal => event.price * quantity;
}

/// Pesanan tiket yang sudah dibayar (hasil input checkout).
class TicketOrder {
  const TicketOrder({
    required this.bookingCode,
    required this.buyer,
    required this.lines,
    required this.method,
    required this.paidAt,
  });

  final String bookingCode;
  final BuyerInfo buyer;
  final List<CartLine> lines;
  final PaymentMethod method;
  final DateTime paidAt;

  int get total => lines.fold(0, (sum, line) => sum + line.subtotal);

  /// "Wayang Kulit: Bima Bungkus (x2) & Pentas Tari Topeng Malangan (x1)"
  String get itemsSummary => lines
      .map((line) => '${line.event.shortTitle} (x${line.quantity})')
      .join(' & ');
}
