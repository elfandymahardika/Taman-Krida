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

  /// Juga nilai `method` yang dikirim ke API.
  final String shortLabel;

  static PaymentMethod? fromLabel(String? label) {
    for (final method in values) {
      if (method.shortLabel == label) return method;
    }
    return null;
  }
}

/// Status bayar pesanan, sama dengan status Transaksi di dashboard admin.
enum PaymentStatus {
  waiting('Menunggu bayar', 'Menunggu Pembayaran'),
  verifying('Perlu verifikasi', 'Sedang Diverifikasi'),
  paid('Lunas', 'Lunas');

  const PaymentStatus(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static PaymentStatus fromApi(String? value) =>
      values.firstWhere((s) => s.apiValue == value, orElse: () => waiting);
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

/// Satu baris keranjang / pesanan: acara + jumlah tiket.
class CartLine {
  const CartLine({
    required this.event,
    required this.quantity,
    this.orderId,
    this.ticketCodes = const [],
    this.note,
  });

  final CulturalEvent event;
  final int quantity;

  /// Nomor transaksi di dashboard (TK-MMYY-NNNN), terisi setelah checkout.
  final String? orderId;

  /// Kode per lembar tiket, terbit setelah pembayaran dinyatakan lunas.
  final List<String> ticketCodes;

  /// Catatan admin, mis. alasan bukti transfer ditolak.
  final String? note;

  int get subtotal => event.price * quantity;
}

/// Pesanan tiket (satu kode booking, bisa berisi beberapa acara).
class TicketOrder {
  const TicketOrder({
    required this.bookingCode,
    required this.buyer,
    required this.lines,
    required this.createdAt,
    this.status = PaymentStatus.waiting,
    this.method,
    this.paidAt,
    this.payBefore,
  });

  final String bookingCode;
  final BuyerInfo buyer;
  final List<CartLine> lines;
  final DateTime createdAt;
  final PaymentStatus status;
  final PaymentMethod? method;
  final DateTime? paidAt;

  /// Batas unggah bukti transfer sebelum kursi dilepas.
  final DateTime? payBefore;

  bool get isPaid => status == PaymentStatus.paid;

  int get total => lines.fold(0, (sum, line) => sum + line.subtotal);

  int get ticketCount => lines.fold(0, (sum, line) => sum + line.quantity);

  /// Catatan penolakan bukti transfer dari admin, jika ada.
  String? get adminNote {
    for (final line in lines) {
      if (line.note != null) return line.note;
    }
    return null;
  }

  /// "Wayang Kulit: Bima Bungkus (x2) & Pentas Tari Topeng Malangan (x1)"
  String get itemsSummary => lines
      .map((line) => '${line.event.shortTitle} (x${line.quantity})')
      .join(' & ');
}
