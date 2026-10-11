import 'dart:math';

import 'package:flutter/material.dart';

import '../core/utils/formatters.dart';
import '../data/dummy/dummy_data.dart';
import '../data/dummy/notification_data.dart';
import '../data/models/app_notification.dart';
import '../data/models/community.dart';
import '../data/models/cultural_event.dart';
import '../data/models/facility.dart';
import '../data/models/rental_request.dart';
import '../data/models/ticket_order.dart';
import '../data/models/user_account.dart';

/// State aplikasi: sesi login, keranjang tiket, pesanan, pengajuan sewa,
/// pendaftaran komunitas, dan notifikasi.
/// Disimpan di memori: data kembali ke kondisi awal saat aplikasi ditutup.
class AppState extends ChangeNotifier {
  AppState()
    : _accounts = [DummyData.demoAccount],
      _orders = DummyData.seedOrders(),
      _rentals = DummyData.seedRentals(),
      _notifications = NotificationData.seed(DateTime.now());

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
    required String city,
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
      city: city.trim(),
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
    final ticketCount = order.lines.fold(0, (sum, l) => sum + l.quantity);
    _notify(
      symbol: '🎟',
      title: 'E-tiket telah terbit',
      body:
          'Kode ${order.bookingCode} untuk $ticketCount tiket sudah tersedia '
          'di Tiket Saya.',
      target: NotificationTarget.tickets,
    );
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
  RentalDraft _rentalDraft = RentalDraft();
  int _nextRentalNumber = 21;

  List<RentalRequest> get rentals => List.unmodifiable(_rentals);
  RentalDraft get rentalDraft => _rentalDraft;

  RentalRequest? findRental(String code) {
    for (final rental in _rentals) {
      if (rental.code == code) return rental;
    }
    return null;
  }

  /// Memulai pengajuan baru (langkah 1). [facility] dari denah/ajukan ulang.
  void startRental({Facility? facility, String activityName = ''}) {
    final user = _currentUser;
    _rentalDraft = RentalDraft()
      ..facility = facility
      ..activityName = activityName
      ..applicantName = user?.name ?? ''
      ..contact = user?.phone ?? '';
    notifyListeners();
  }

  void selectRentalVenue(Facility facility) {
    if (_rentalDraft.facility?.id != facility.id) {
      _rentalDraft
        ..facility = facility
        ..date = null
        ..slot = null;
    }
    notifyListeners();
  }

  void selectRentalDate(DateTime date) {
    _rentalDraft
      ..date = DateUtils.dateOnly(date)
      ..slot = null;
    notifyListeners();
  }

  void selectRentalSlot(RentalSlot slot) {
    _rentalDraft.slot = slot;
    notifyListeners();
  }

  void saveRentalForm({
    required String activityName,
    required String applicantName,
    required String contact,
  }) {
    _rentalDraft
      ..activityName = activityName.trim()
      ..applicantName = applicantName.trim()
      ..contact = contact.trim();
    notifyListeners();
  }

  /// Simulasi unggah berkas: nama file dibuat dari jenis dokumen.
  void attachRentalDocument(String label) {
    final slug = label.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '_');
    _rentalDraft.documents[label] = UploadedFile(
      fileName: '$slug.pdf',
      sizeLabel: '${(_random.nextInt(18) + 4) * 100} KB',
      type: 'PDF',
    );
    notifyListeners();
  }

  bool _isPast(DateTime date) =>
      DateUtils.dateOnly(date).isBefore(DateUtils.dateOnly(DateTime.now()));

  /// Slot dianggap penuh jika dipakai agenda lain (simulasi deterministik)
  /// atau oleh pengajuan sewa yang masih berlaku.
  bool isSlotTaken(Facility facility, DateTime date, RentalSlot slot) {
    final agenda = (date.day + facility.number + slot.index) % 3 == 0;
    return agenda ||
        _rentals.any(
          (r) =>
              r.holdsSchedule &&
              r.facility.id == facility.id &&
              r.slot == slot &&
              DateUtils.isSameDay(r.date, date),
        );
  }

  /// Tanggal penuh: ada agenda sehari penuh atau semua slot terpakai.
  bool isDateFull(Facility facility, DateTime date) {
    final fullDayAgenda =
        (date.day + facility.number * 2 + date.month) % 7 == 0;
    return fullDayAgenda ||
        RentalSlot.values.every((slot) => isSlotTaken(facility, date, slot));
  }

  bool isDatePast(DateTime date) => _isPast(date);

  RentalRequest submitRental() {
    final draft = _rentalDraft;
    if (draft.facility == null || draft.date == null || draft.slot == null) {
      throw StateError('Venue, tanggal, dan slot belum dipilih.');
    }
    final now = DateTime.now();
    final request = RentalRequest(
      code:
          'SG-${Formatters.twoDigits(now.month)}${now.year % 100}-'
          '${(_nextRentalNumber++).toString().padLeft(4, '0')}',
      facility: draft.facility!,
      activityName: draft.activityName,
      date: draft.date!,
      slot: draft.slot!,
      applicantName: draft.applicantName,
      contact: draft.contact,
      documentCount: draft.documents.length,
      submittedAt: now,
    );
    _rentals.insert(0, request);
    _rentalDraft = RentalDraft();
    notifyListeners();
    return request;
  }

  void _replaceRental(RentalRequest updated) {
    final index = _rentals.indexWhere((r) => r.code == updated.code);
    _rentals[index] = updated;
  }

  /// Simulasi keputusan admin: disetujui.
  void approveRental(String code) {
    final rental = findRental(code)!;
    _replaceRental(
      rental.copyWith(
        status: RentalStatus.approved,
        reviewedAt: DateTime.now(),
      ),
    );
    _notify(
      symbol: '✅',
      title: 'Pengajuan sewa disetujui',
      body:
          '$code · ${rental.facility.name} disetujui admin. Selesaikan '
          'pembayaran dalam 2×24 jam.',
      target: NotificationTarget.rental,
      targetId: code,
    );
  }

  /// Simulasi keputusan admin: ditolak beserta catatan.
  void rejectRental(String code) {
    final rental = findRental(code)!;
    _replaceRental(
      rental.copyWith(
        status: RentalStatus.rejected,
        reviewedAt: DateTime.now(),
        adminNote: DummyData.rejectionNote(rental.date),
        fixes: DummyData.rejectionFixes,
      ),
    );
    _notify(
      symbol: '❌',
      title: 'Pengajuan sewa ditolak',
      body: '$code ditolak admin. Lihat catatan dan ajukan ulang.',
      target: NotificationTarget.rental,
      targetId: code,
    );
  }

  void payRental(String code, PaymentMethod method) {
    final rental = findRental(code)!;
    _replaceRental(
      rental.copyWith(status: RentalStatus.paid, paymentMethod: method),
    );
    _notify(
      symbol: '🧾',
      title: 'Pembayaran sewa diterima',
      body:
          'Bukti reservasi $code untuk ${rental.facility.name} telah '
          'diterbitkan.',
      target: NotificationTarget.rental,
      targetId: code,
    );
  }

  // ------------------------------------------------------------ Komunitas

  final List<CommunityRegistration> _communityRegistrations = [];

  List<CommunityRegistration> get communityRegistrations =>
      List.unmodifiable(_communityRegistrations);

  void registerCommunity(CommunityRegistration registration) {
    _communityRegistrations.insert(0, registration);
    _notify(
      symbol: '👥',
      title: 'Pendaftaran komunitas ditinjau',
      body:
          'Data ${registration.name} sedang diverifikasi admin '
          '(1–3 hari kerja).',
      target: NotificationTarget.communities,
    );
  }

  // ----------------------------------------------------------- Notifikasi

  final List<AppNotification> _notifications;
  int _notificationSeq = 100;

  List<AppNotification> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.read).length;

  void _notify({
    required String symbol,
    required String title,
    required String body,
    required NotificationTarget target,
    String? targetId,
  }) {
    _notifications.insert(
      0,
      AppNotification(
        id: 'n${_notificationSeq++}',
        symbol: symbol,
        title: title,
        body: body,
        createdAt: DateTime.now(),
        target: target,
        targetId: targetId,
      ),
    );
    notifyListeners();
  }

  void markNotificationRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index < 0 || _notifications[index].read) return;
    _notifications[index] = _notifications[index].markRead();
    notifyListeners();
  }

  void markAllNotificationsRead() {
    for (var i = 0; i < _notifications.length; i++) {
      _notifications[i] = _notifications[i].markRead();
    }
    notifyListeners();
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
