import 'package:flutter/foundation.dart';

import '../../domain/entities/rental_request.dart';
import '../../domain/entities/ticket_order.dart';
import '../../domain/usecases/ticket_usecases.dart' as rules;
import '../../domain/usecases/ticket_usecases.dart';
import 'account_data_controller.dart';
import 'catalog_controller.dart';
import 'notification_controller.dart';

/// Keranjang tiket, checkout, dan pesanan milik akun.
class TicketController extends ChangeNotifier implements AccountDataController {
  TicketController({
    required this._getBookings,
    required this._checkout,
    required this._payBooking,
    required this._catalog,
    required this._notifications,
  }) {
    // Isi keranjang bergantung pada daftar acara (harga & kuota).
    _catalog.addListener(notifyListeners);
  }

  final GetBookingsUseCase _getBookings;
  final CheckoutUseCase _checkout;
  final PayBookingUseCase _payBooking;
  final CatalogController _catalog;
  final NotificationController _notifications;

  static const maxTicketsPerEvent = rules.maxTicketsPerEvent;

  // ------------------------------------------------------------ Keranjang

  final Map<String, int> _cart = {};

  int quantityOf(String eventId) => _cart[eventId] ?? 0;

  void setQuantity(String eventId, int quantity) {
    final clamped = quantity.clamp(0, maxTicketsPerEvent);
    if (clamped == 0) {
      _cart.remove(eventId);
    } else {
      _cart[eventId] = clamped;
    }
    notifyListeners();
  }

  /// Dipakai dari halaman detail: pastikan acara ada di keranjang.
  void ensureInCart(String eventId) {
    if (quantityOf(eventId) == 0) setQuantity(eventId, 1);
  }

  List<CartLine> get cartLines => [
    for (final event in _catalog.events)
      if (quantityOf(event.id) > 0)
        CartLine(event: event, quantity: quantityOf(event.id)),
  ];

  int get cartTotal => cartLines.fold(0, (sum, line) => sum + line.subtotal);

  bool get isCartEmpty => cartLines.isEmpty;

  // ------------------------------------------------------------- Checkout

  BuyerInfo? _buyer;
  PaymentMethod _paymentMethod = PaymentMethod.qris;

  BuyerInfo? get buyer => _buyer;
  PaymentMethod get paymentMethod => _paymentMethod;

  void saveBuyer(BuyerInfo buyer) {
    _buyer = buyer;
    notifyListeners();
  }

  void selectPaymentMethod(PaymentMethod method) {
    _paymentMethod = method;
    notifyListeners();
  }

  // -------------------------------------------------------------- Pesanan

  List<TicketOrder> _orders = [];

  List<TicketOrder> get orders => List.unmodifiable(_orders);

  /// Semua baris tiket dari seluruh pesanan, terbaru lebih dulu.
  List<({TicketOrder order, CartLine line})> get ticketLines => [
    for (final order in _orders)
      for (final line in order.lines) (order: order, line: line),
  ];

  TicketOrder? findOrder(String bookingCode) {
    for (final order in _orders) {
      if (order.bookingCode == bookingCode) return order;
    }
    return null;
  }

  void _putOrder(TicketOrder order) {
    _orders = [
      order,
      for (final o in _orders)
        if (o.bookingCode != order.bookingCode) o,
    ];
  }

  /// Buat pesanan dari keranjang (status "Menunggu pembayaran") lalu
  /// kosongkan keranjang. Melempar `Failure` bila ditolak server (mis.
  /// kuota habis).
  Future<TicketOrder> placeOrder() async {
    final order = await _checkout(cartLines, _buyer);
    _putOrder(order);
    _cart.clear();
    notifyListeners();
    // Kuota acara & notifikasi berubah setelah checkout.
    _catalog.refreshEvents();
    _notifications.refreshQuietly();
    return order;
  }

  /// Unggah bukti pembayaran → "Sedang diverifikasi" admin.
  Future<TicketOrder> payBooking(
    String code,
    PaymentMethod method,
    UploadedFile proof,
    String sender,
  ) async {
    final order = await _payBooking(code, method, proof, sender);
    _putOrder(order);
    notifyListeners();
    return order;
  }

  @override
  Future<void> load() async {
    _orders = await _getBookings();
    notifyListeners();
  }

  @override
  void clear() {
    _orders = [];
    _buyer = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _catalog.removeListener(notifyListeners);
    super.dispose();
  }
}
