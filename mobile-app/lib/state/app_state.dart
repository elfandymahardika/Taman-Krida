import 'dart:math';

import 'package:flutter/material.dart';

import '../core/utils/formatters.dart';
import '../data/dummy/dummy_data.dart';
import '../data/models/cultural_event.dart';
import '../data/models/facility.dart';
import '../data/models/rental_request.dart';
import '../data/models/ticket_order.dart';
import '../data/models/user_account.dart';

/// State aplikasi (sesi login, keranjang tiket, pesanan, pengajuan sewa).
/// Disimpan di memori: data kembali ke kondisi awal saat aplikasi ditutup.
class AppState extends ChangeNotifier {
  AppState()
    : _accounts = [DummyData.demoAccount],
      _orders = DummyData.seedOrders(),
      _rentals = DummyData.seedRentals();

  static const maxTicketsPerEvent = 4;

  final _random = Random();

  // ---------------------------------------------------------------- Akun

  final List<UserAccount> _accounts;
  UserAccount? _currentUser;

  UserAccount? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  UserAccount? _findAccount(String email) {
    final key = email.trim().toLowerCase();
    for (final account in _accounts) {
      if (account.email.toLowerCase() == key) return account;
    }
    return null;
  }

  /// Mengembalikan pesan error, atau `null` jika login berhasil.
  String? login(String email, String password) {
    final account = _findAccount(email);
    if (account == null) {
      return 'Email belum terdaftar. Silakan daftar akun baru.';
    }
    if (account.password != password) {
      return 'Kata sandi salah. Periksa kembali kata sandi Anda.';
    }
    _currentUser = account;
    notifyListeners();
    return null;
  }

  /// Mendaftarkan akun baru lalu langsung login.
  String? register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) {
    if (_findAccount(email) != null) {
      return 'Email sudah terdaftar. Silakan masuk.';
    }
    final account = UserAccount(
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password,
      memberSince: DateTime.now().year,
    );
    _accounts.add(account);
    _currentUser = account;
    notifyListeners();
    return null;
  }

  String? updateProfile({
    required String name,
    required String email,
    required String phone,
  }) {
    final current = _currentUser;
    if (current == null) return 'Silakan masuk terlebih dahulu.';
    final owner = _findAccount(email);
    if (owner != null && owner != current) {
      return 'Email sudah dipakai akun lain.';
    }
    final updated = current.copyWith(
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    );
    _accounts[_accounts.indexOf(current)] = updated;
    _currentUser = updated;
    notifyListeners();
    return null;
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  // ------------------------------------------------------ Keranjang tiket

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
    for (final event in DummyData.events)
      if (quantityOf(event.id) > 0)
        CartLine(event: event, quantity: quantityOf(event.id)),
  ];

  int get cartTotal => cartLines.fold(0, (sum, line) => sum + line.subtotal);

  bool get isCartEmpty => _cart.isEmpty;

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

  final List<TicketOrder> _orders;

  List<TicketOrder> get orders => List.unmodifiable(_orders);

  /// Semua baris tiket dari seluruh pesanan, terbaru lebih dulu.
  List<({TicketOrder order, CartLine line})> get ticketLines => [
    for (final order in _orders)
      for (final line in order.lines) (order: order, line: line),
  ];

  /// Menyelesaikan pembayaran (simulasi) dan mengosongkan keranjang.
  TicketOrder placeOrder() {
    final buyer = _buyer;
    if (buyer == null || isCartEmpty) {
      throw StateError('Data pemesan atau keranjang belum lengkap.');
    }
    final order = TicketOrder(
      bookingCode: 'TKBJ-${_randomCode(6)}',
      buyer: buyer,
      lines: cartLines,
      method: _paymentMethod,
      paidAt: DateTime.now(),
    );
    _orders.insert(0, order);
    _cart.clear();
    notifyListeners();
    return order;
  }

  TicketOrder? findOrder(String bookingCode) {
    for (final order in _orders) {
      if (order.bookingCode == bookingCode) return order;
    }
    return null;
  }

  // ---------------------------------------------------------- Sewa gedung

  final List<RentalRequest> _rentals;

  List<RentalRequest> get rentals => List.unmodifiable(_rentals);

  bool isVenueBooked(Facility facility, DateTime date) {
    final booked = DummyData.bookedDates[facility.id] ?? const [];
    final takenByRequest = _rentals.any(
      (r) => r.facility.id == facility.id && DateUtils.isSameDay(r.date, date),
    );
    return takenByRequest || booked.any((d) => DateUtils.isSameDay(d, date));
  }

  RentalRequest submitRental({
    required Facility facility,
    required String activityName,
    required DateTime date,
    required int startHour,
    required int durationHours,
    required String applicantName,
    required String contact,
  }) {
    final now = DateTime.now();
    final request = RentalRequest(
      code:
          'SG-${Formatters.twoDigits(now.month)}${now.year % 100}-'
          '${(_rentals.length + 19).toString().padLeft(4, '0')}',
      facility: facility,
      activityName: activityName.trim(),
      date: date,
      startHour: startHour,
      durationHours: durationHours,
      applicantName: applicantName.trim(),
      contact: contact.trim(),
    );
    _rentals.insert(0, request);
    notifyListeners();
    return request;
  }

  String _randomCode(int length) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return List.generate(
      length,
      (_) => chars[_random.nextInt(chars.length)],
    ).join();
  }

  CulturalEvent eventById(String id) =>
      DummyData.events.firstWhere((event) => event.id == id);
}

/// Menyediakan [AppState] ke seluruh widget di bawahnya dan me-rebuild
/// widget yang memanggil [AppStateScope.of] saat state berubah.
class AppStateScope extends InheritedNotifier<AppState> {
  const AppStateScope({
    super.key,
    required AppState state,
    required super.child,
  }) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppStateScope>();
    assert(scope != null, 'AppStateScope tidak ditemukan di atas widget ini.');
    return scope!.notifier!;
  }

  /// Akses tanpa berlangganan perubahan (untuk callback tombol).
  static AppState read(BuildContext context) {
    final scope = context.getInheritedWidgetOfExactType<AppStateScope>();
    return scope!.notifier!;
  }
}
